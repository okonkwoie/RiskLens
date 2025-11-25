
import { GoogleGenAI, Tool } from '@google/genai';
import { EntityRiskReport, GlobalEvent, SearchSource } from '../types';
import { GEMINI_MODEL } from '../constants';

// Initialize API Client
// Note: This relies on the env variable being injected.
const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

const searchTool: Tool = {
  googleSearch: {},
};

/**
 * Scrapes and analyzes an entity using Gemini with Google Search Grounding.
 */
export const analyzeEntityRisk = async (entityName: string): Promise<{ report: EntityRiskReport; sources: SearchSource[] }> => {
  const prompt = `
    Conduct a rigorous due diligence and adverse media investigation on: "${entityName}".
    
    Use Google Search to find real-time, factual information.
    
    You must categorize the findings into the following 6 categories:
    1. Entity Info (Basic background, industry, location)
    2. Litigation (Lawsuits, legal disputes, court cases)
    3. Sanctions (OFAC, EU, UN lists, blacklists, debarments)
    4. Reputational Issues (Negative news, scandals, allegations, fraud)
    5. PEP Exposure (Politically Exposed Persons connections)
    6. Compliance Gaps (Regulatory fines, warnings, lack of controls)

    Also estimate a Risk Score from 0 (Safe) to 100 (Critical) based on the severity of findings.

    Format your response as a valid JSON object with the following keys:
    "entityInfo", "litigation", "sanctions", "reputation", "pepExposure", "complianceGaps", "riskScore" (number).
    
    If no adverse info is found for a category, state "No significant adverse records identified in public sources."
    
    IMPORTANT: Return ONLY the JSON object. Do not include markdown formatting, code blocks, or introductory text.
  `;

  try {
    const response = await ai.models.generateContent({
      model: GEMINI_MODEL,
      contents: prompt,
      config: {
        tools: [searchTool],
        // responseMimeType is not allowed with googleSearch, so we parse manually.
      },
    });

    const text = response.text || "{}";
    
    // Robust JSON extraction: Find the first '{' and the last '}' to ignore pre/post-amble text
    const jsonMatch = text.match(/\{[\s\S]*\}/);
    const cleanJson = jsonMatch ? jsonMatch[0] : text;
    
    let report: EntityRiskReport;
    try {
        const raw = JSON.parse(cleanJson);
        
        // Recursive helper to flatten any JSON structure into a readable string
        const ensureString = (val: any, depth = 0): string => {
            if (val === null || val === undefined) return "No data available.";
            if (typeof val === 'string') return val;
            if (typeof val === 'number' || typeof val === 'boolean') return val.toString();
            
            // Handle Arrays: Create a bulleted list
            if (Array.isArray(val)) {
                if (val.length === 0) return "None.";
                // If simple strings, comma separate for compactness in some contexts, or bullets in others.
                // Let's use bullets for readability.
                return val.map(item => `• ${ensureString(item, depth + 1)}`).join('\n');
            }
            
            // Handle Objects: Recursively format key-values
            if (typeof val === 'object') {
                return Object.entries(val)
                    .map(([k, v]) => {
                         // Format key: camelCase -> Title Case
                        const cleanKey = k.replace(/([A-Z])/g, ' $1').replace(/^./, str => str.toUpperCase());
                        return `${cleanKey}: ${ensureString(v, depth + 1)}`;
                    })
                    .join(depth > 0 ? ', ' : '\n'); // Comma for inner objects, newline for top level
            }
            
            return JSON.stringify(val);
        };

        report = {
            entityInfo: ensureString(raw.entityInfo),
            litigation: ensureString(raw.litigation),
            sanctions: ensureString(raw.sanctions),
            reputation: ensureString(raw.reputation),
            pepExposure: ensureString(raw.pepExposure),
            complianceGaps: ensureString(raw.complianceGaps),
            riskScore: typeof raw.riskScore === 'number' ? raw.riskScore : 50
        };
        
    } catch (e) {
        console.warn("Failed to parse JSON directly:", e);
        // Fallback structure if JSON parsing fails but we have text
        report = {
            entityInfo: "Content generated but structured parsing failed. Raw summary: " + text.substring(0, 150) + "...",
            litigation: "Data unavailable due to format error.",
            sanctions: "Data unavailable due to format error.",
            reputation: "Data unavailable due to format error.",
            pepExposure: "Data unavailable due to format error.",
            complianceGaps: "Data unavailable due to format error.",
            riskScore: 0
        };
    }

    // Extract sources from grounding metadata
    const sources: SearchSource[] = [];
    const chunks = response.candidates?.[0]?.groundingMetadata?.groundingChunks;
    
    if (chunks) {
      chunks.forEach((chunk) => {
        if (chunk.web?.uri && chunk.web?.title) {
          sources.push({
            title: chunk.web.title,
            uri: chunk.web.uri,
          });
        }
      });
    }

    return { report, sources };

  } catch (error) {
    console.error("Gemini Analysis Error:", error);
    throw new Error("Failed to analyze entity.");
  }
};

/**
 * Fetches latest global adverse media events with a focus on Nigeria.
 */
export const getGlobalRiskUpdates = async (): Promise<GlobalEvent[]> => {
  const prompt = `
    Find 8 significant news stories related to financial crime, money laundering, sanctions, PEP scandals, or corporate fraud.
    
    CRITICAL INSTRUCTION: 
    - The news MUST be heavily focused on NIGERIA (at least 5 stories).
    - Specifically include recent news regarding Ezra Olubi (Paystack) if available, or other prominent tech figures in Nigeria.
    - Use verified, credible sources (e.g., Punch, Vanguard, ThisDay, EFCC Reports, Reuters, TechCabal, TechPoint).
    - The events must be actual news from the last 1-2 months.
    - **IMPORTANT**: You must provide the VALID, CLICKABLE URL for the specific news article in the 'url' field. Do not fabricate URLs.

    Return a JSON array of objects. Each object must have:
    - headline (string)
    - summary (short string, 1-2 sentences)
    - insights (string: a detailed paragraph (approx 50 words) explaining the background, specific allegations, and risk implications)
    - location (string, e.g., "Lagos, Nigeria")
    - severity ("HIGH", "MEDIUM", "LOW")
    - category (strictly one of: "LITIGATION", "SANCTIONS", "REPUTATION", "PEP", "COMPLIANCE")
    - timestamp (string: The ACTUAL date of the news article in "DD MMM YYYY" format, e.g. "15 Oct 2024")
    - url (string: The direct link to the news article found via search)
    - source (string: The name of the news publisher, e.g. "Punch", "TechCabal", "Reuters")
    
    IMPORTANT: Return ONLY the JSON array. Do not use Markdown.
  `;

  try {
    const response = await ai.models.generateContent({
      model: GEMINI_MODEL,
      contents: prompt,
      config: {
        tools: [searchTool],
      },
    });

    const text = response.text || "[]";
    // Robust JSON array extraction
    const jsonMatch = text.match(/\[[\s\S]*\]/);
    const cleanJson = jsonMatch ? jsonMatch[0] : "[]";
    
    return JSON.parse(cleanJson);
  } catch (error) {
    console.error("Global Updates Error:", error);
    return [];
  }
};