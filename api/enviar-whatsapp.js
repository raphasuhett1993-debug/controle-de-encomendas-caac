export const config = {
  runtime: "nodejs"
};

import fetch from "node-fetch";
import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ erro: "Método não permitido" });
  }

  try {
    const { encomendaId } = req.body;

    if (!encomendaId) {
      return res.status(400).json({ erro: "encomendaId não informado" });
    }

    // 1️⃣ Busca dados da encomenda
    const { data: encomenda, error } = await supabase
      .from("encomendas")
      .select(`
        id,
        codigo_unico,
        moradores (
          nome,
          telefone_whatsapp
        )
      `)
      .eq("id", encomendaId)
      .single();

    if (error || !encomenda) {
      return res.status(404).json({ erro: "Encomenda não encontrada" });
    }

    if (!encomenda.moradores?.telefone_whatsapp) {
      return res.status(400).json({ erro: "Morador sem telefone" });
    }

    // 2️⃣ Monta mensagem
    const mensagem = `📦 *Encomenda recebida!*

Olá, ${encomenda.moradores.nome}

Sua encomenda foi registrada na portaria.
Código: *${encomenda.codigo_unico}*

📍 Condomínio`;

    // 3️⃣ Envia WhatsApp
    const resp = await fetch(
      `https://graph.facebook.com/v19.0/${process.env.WHATSAPP_PHONE_ID}/messages`,
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${process.env.WHATSAPP_TOKEN}`,
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          messaging_product: "whatsapp",
          to: encomenda.moradores.telefone_whatsapp,
          type: "text",
          text: { body: mensagem }
        })
      }
    );

    const json = await resp.json();

    if (json.error) {
      console.error(json.error);
      return res.status(500).json({ erro: "Erro ao enviar WhatsApp", detalhe: json.error });
    }

    // 4️⃣ Atualiza status no banco
    if (json.messages?.[0]?.id) {
      await supabase
        .from("encomendas")
        .update({
          zaid: json.messages[0].id,
          zap_status: "SENT"
        })
        .eq("id", encomendaId);
    }

    res.json({ sucesso: true });
  } catch (err) {
    console.error(err);
    res.status(500).json({ erro: "Erro interno" });
  }
}
