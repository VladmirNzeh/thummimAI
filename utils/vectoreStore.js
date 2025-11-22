import { OpenAIEmbeddings } from "@langchain/openai";
import { Chroma } from "@langchain/community/vectorstores/chroma";
import { Document } from "langchain/document";
import fs from "fs";
import path from "path";

const DOCUMENTS_DIR = path.resolve("./data/docs");

export const initializeVectorStore = async () => {
  const embeddings = new OpenAIEmbeddings({
    apiKey: process.env.OPENAI_API_KEY,
    model: "text-embedding-3-large" // recommended
  });

  const store = await Chroma.fromDocuments([], embeddings, {
    collectionName: "documents",
    url: "http://localhost:8000", // local Chroma server
    persistDirectory: "./db"
  });

  const files = fs.readdirSync(DOCUMENTS_DIR);

  for (let file of files) {
    const filePath = path.join(DOCUMENTS_DIR, file);
    const content = fs.readFileSync(filePath, "utf-8");

    const doc = new Document({
      pageContent: content,
      metadata: { source: file }
    });

    await store.addDocuments([doc]);
  }

  await store.persist();

  return store;
};
