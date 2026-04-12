import { Server } from '@hocuspocus/server';
import { PrismaClient } from '@prisma/client';
import * as jwt from 'jsonwebtoken';
import * as dotenv from 'dotenv';

dotenv.config();

const prisma = new PrismaClient();

const server = Server.configure({
  port: 1234,

  async onAuthenticate(data) {
    const { token } = data;
    
    if (!token) {
      throw new Error('Unauthorized');
    }

    try {
      const decoded = jwt.verify(token, process.env.JWT_SECRET || 'secret') as any;
      return {
        user: {
          id: decoded.sub,
          name: decoded.fullName || 'Anonymous',
        },
      };
    } catch (err) {
      throw new Error('Unauthorized');
    }
  },

  async onLoadDocument(data) {
    const { documentName } = data;
    // documentName is the docId
    const doc = await prisma.doc.findUnique({
      where: { id: documentName },
    });

    if (!doc) {
      throw new Error('Document not found');
    }

    // Convert JSON content to Y.Doc if needed, 
    // but Hocuspocus handles the Y.Doc sync if we just return empty or the binary state.
    // For Tiptap, we usually send the field name "default".
    return null; 
  },

  async onStoreDocument(data) {
    const { documentName, document } = data;
    
    // In Tiptap/Hocuspocus, we can extract the JSON from the Y.Doc
    // However, it's easier to use a common pattern where we save the entire Y.Doc binary 
    // OR we convert to JSON. For simplicity with existing schema, we'll convert to JSON.
    // This requires @hocuspocus/transformer or similar, 
    // or just let the frontend handle the JSON save since we already have autosave there?
    
    // BETTER: Hocuspocus should be the source of truth.
    // We'll just update the updatedAt for now to show activity.
    await prisma.doc.update({
      where: { id: documentName },
      data: {
        updatedAt: new Date(),
      },
    });
  },
});

server.listen();
console.log('Collaboration server started on port 1234');
