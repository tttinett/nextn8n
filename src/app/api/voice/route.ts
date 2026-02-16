import { NextResponse } from "next/server";
import productsData from "@/src/data/products.json";

export const runtime = "nodejs";

/* ✅ สร้าง Type ของสินค้า */
type Product = {
  sku: string;
  name: string;
  category: string;
  price: number;
  stock: number;
  warranty_months: number;
  tags: string[];
};

/* ✅ กำหนด type ให้ products */
const products: Product[] = productsData;

export async function POST(req: Request) {
  try {
    const { text } = await req.json();
    const transcript = (text || "").trim().toLowerCase();

    if (!transcript) {
      return NextResponse.json(
        { error: "ไม่มีข้อความจากการพูด" },
        { status: 400 }
      );
    }

    /* 🔥 เช็คในฐานข้อมูลก่อน (Hybrid Mode) */
    const found = products.find((p) =>
      p.tags.some((tag) => transcript.includes(tag.toLowerCase()))
    );

    if (found) {
      return NextResponse.json({
        answer: `${found.name} ราคา ${found.price} บาท เหลือ ${found.stock} ชิ้น`,
      });
    }

    /* 🔥 ถ้าไม่เจอค่อยยิง n8n */
    const n8nUrl = process.env.N8N_WEBHOOK_URL;

    if (!n8nUrl) {
      return NextResponse.json(
        { error: "ยังไม่ได้ตั้งค่า N8N_WEBHOOK_URL" },
        { status: 500 }
      );
    }

    const resp = await fetch(n8nUrl, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        transcript,
        products,
        lang: "th",
      }),
    });

    const data = await resp.json().catch(() => ({}));

    return NextResponse.json(data, {
      status: resp.ok ? 200 : resp.status,
    });
  } catch (e: unknown) {
    return NextResponse.json(
      { error: "Server error" },
      { status: 500 }
    );
  }
}