// Edge Function for generating claim PDF reports
// This would be deployed as a Supabase Edge Function

import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
import { PDFDocument, StandardFonts } from 'https://deno.land/x/pdfkit@v0.16.0/mod.ts';

// In a real implementation, these would be environment variables
const SUPABASE_URL = Deno.env.get('SUPABASE_URL');
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');

serve(async (req) => {
  try {
    // Create a Supabase client with service role key for full access
    const supabase = createClient(SUPABASE_URL!, SUPABASE_SERVICE_ROLE_KEY!);
    
    // Get the claim ID from the request
    const { claim_id } = await req.json();
    
    // Fetch claim data
    const { data: claim, error } = await supabase
      .from('claims')
      .select(`
        *,
        orders(id, status),
        products(name, sku),
        retailers(name),
        locations(name)
      `)
      .eq('id', claim_id)
      .single();
    
    if (error) {
      return new Response(JSON.stringify({ error: error.message }), {
        headers: { "Content-Type": "application/json" },
        status: 400,
      });
    }
    
    if (!claim) {
      return new Response(JSON.stringify({ error: 'Claim not found' }), {
        headers: { "Content-Type": "application/json" },
        status: 404,
      });
    }
    
    // Create PDF document
    const doc = new PDFDocument();
    const chunks: Uint8Array[] = [];
    
    doc.on('data', (chunk) => chunks.push(chunk));
    doc.on('end', () => {});
    
    // Add content to PDF
    doc.font(StandardFonts.Helvetica)
       .fontSize(20)
       .text('IV RELIFE - Claim Report', { align: 'center' });
    
    doc.moveDown()
       .fontSize(12)
       .text(`Claim ID: ${claim.id}`)
       .text(`Date: ${new Date(claim.created_at).toLocaleDateString()}`)
       .text(`Status: ${claim.status}`)
       .moveDown()
       .text(`Reason: ${claim.reason}`)
       .moveDown();
    
    if (claim.resolution_notes) {
      doc.text(`Resolution Notes: ${claim.resolution_notes}`);
    }
    
    // Add order information if available
    if (claim.orders) {
      doc.moveDown()
         .fontSize(14)
         .text('Order Information')
         .fontSize(12)
         .text(`Order ID: ${claim.orders.id}`)
         .text(`Order Status: ${claim.orders.status}`);
    }
    
    // Add product information if available
    if (claim.products) {
      doc.moveDown()
         .fontSize(14)
         .text('Product Information')
         .fontSize(12)
         .text(`Product Name: ${claim.products.name}`)
         .text(`SKU: ${claim.products.sku}`);
    }
    
    // Add retailer information if available
    if (claim.retailers) {
      doc.moveDown()
         .fontSize(14)
         .text('Retailer Information')
         .fontSize(12)
         .text(`Retailer: ${claim.retailers.name}`);
    }
    
    // Add location information if available
    if (claim.locations) {
      doc.moveDown()
         .fontSize(14)
         .text('Location Information')
         .fontSize(12)
         .text(`Location: ${claim.locations.name}`);
    }
    
    doc.end();
    
    // Wait for PDF generation to complete
    const pdfBuffer = await new Promise<Uint8Array>((resolve) => {
      doc.on('end', () => {
        const pdfData = new Uint8Array(chunks.reduce((acc, chunk) => acc.concat(Array.from(chunk)), [] as number[]));
        resolve(pdfData);
      });
    });
    
    // Convert to base64 for transmission
    const base64PDF = btoa(String.fromCharCode(...pdfBuffer));
    
    return new Response(JSON.stringify({ 
      success: true, 
      pdf: base64PDF,
      filename: `claim-${claim_id}.pdf`
    }), {
      headers: { "Content-Type": "application/json" },
      status: 200,
    });
    
  } catch (error) {
    return new Response(JSON.stringify({ error: error.message }), {
      headers: { "Content-Type": "application/json" },
      status: 500,
    });
  }
});