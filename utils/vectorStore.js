import { OpenAIEmbeddings } from "@langchain/openai";
import { Chroma } from "@langchain/community/vectorstores/chroma";
import { Document } from "@langchain/core/documents"; // ✅ updated import
import fs from "fs";
import path from "path";

const DOCUMENTS_DIR = path.resolve("./data/docs");

export const initializeVectorStore = async () => {
  const embeddings = new OpenAIEmbeddings({
    apiKey: process.env.OPENAI_API_KEY,
    model: "text-embedding-3-large"
  });

  const store = await Chroma.fromDocuments([], embeddings, {
    collectionName: "documents",
    url: "http://localhost:8000",
    persistDirectory: "./db"
  });

  const files = fs.readdirSync(DOCUMENTS_DIR);

  const docs = files.map(file => {
    const filePath = path.join(DOCUMENTS_DIR, file);
    const content = fs.readFileSync(filePath, "utf-8");

    return new Document({
      pageContent: content,
      metadata: { source: file }
    });
  });

  await store.addDocuments(docs); // ✅ batch add instead of one by one
  await store.persist();

  return store;
};
