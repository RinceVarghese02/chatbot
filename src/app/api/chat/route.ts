import { NextRequest, NextResponse } from 'next/server';
// Remove isomorphic-unfetch import as Next.js 13+ has native fetch support
// import fetch from 'isomorphic-unfetch';

// Type definition for knowledge base
type KnowledgeBaseType = {
  [key: string]: string;
};

// Knowledge base for common tech topics
const knowledgeBase: KnowledgeBaseType = {
  javascript: "JavaScript is a high-level programming language primarily used for web development. It allows you to create interactive elements on websites and is supported by all modern web browsers.",
  typescript: "TypeScript is a superset of JavaScript that adds static typing. It helps catch errors during development and makes code more maintainable for larger projects.",
  react: "React is a JavaScript library for building user interfaces, particularly single-page applications. It's maintained by Facebook and allows developers to create reusable UI components.",
  nextjs: "Next.js is a React framework that enables server-side rendering and static site generation. It simplifies the process of building fast and SEO-friendly React applications.",
  python: "Python is a high-level, general-purpose programming language known for its readability and simplicity. It's widely used in data science, AI, web development, and automation.",
  html: "HTML (HyperText Markup Language) is the standard markup language for documents designed to be displayed in a web browser. It defines the structure and content of web pages.",
  css: "CSS (Cascading Style Sheets) is a style sheet language used for describing the presentation of a document written in HTML. It controls the layout and appearance of web pages.",
  api: "API (Application Programming Interface) is a set of rules that allows different software applications to communicate with each other. It defines the methods and data formats that applications can use to request and exchange information.",
  database: "A database is an organized collection of data stored electronically. It allows for efficient retrieval, manipulation, and management of data. Common types include relational databases (SQL) and NoSQL databases.",
  git: "Git is a distributed version control system used to track changes in source code during software development. It allows multiple developers to work on the same codebase without conflicts.",
  docker: "Docker is a platform that uses containerization technology to package applications and their dependencies together. This ensures consistent operation across different computing environments.",
  nodejs: "Node.js is a JavaScript runtime environment that allows executing JavaScript code outside a web browser. It's particularly useful for building scalable network applications and APIs.",
  ai: "Artificial Intelligence (AI) refers to computer systems capable of performing tasks that typically require human intelligence. This includes learning from experience, recognizing patterns, and making decisions.",
  machinelearning: "Machine Learning is a subset of AI focused on building systems that can learn from and make decisions based on data. It enables computers to improve performance without explicit programming.",
  frontend: "Frontend development refers to building the user-facing parts of websites and applications. It involves using HTML, CSS, and JavaScript to create interfaces that users can see and interact with.",
  backend: "Backend development refers to server-side web application logic. It involves working with servers, databases, and APIs to power the frontend experience and process business logic.",
  cloud: "Cloud computing provides on-demand delivery of computing services over the internet. This includes servers, storage, databases, networking, software, and analytics without direct active management by the user.",
  security: "Cybersecurity involves protecting computer systems, networks, and data from digital attacks, damage, or unauthorized access. It's increasingly important as more businesses and services move online.",
  devops: "DevOps is a set of practices that combines software development and IT operations. It aims to shorten the development lifecycle while delivering features, fixes, and updates more frequently and reliably."
};

// Web search API endpoints
const WIKIPEDIA_SUMMARY_API = 'https://en.wikipedia.org/api/rest_v1/page/summary/';
const WIKIPEDIA_SEARCH_API = 'https://en.wikipedia.org/w/api.php?action=query&list=search&srsearch=';

export async function POST(request: NextRequest) {
  try {
    const { message } = await request.json();
    
    if (!message) {
      return NextResponse.json({ error: 'Message is required' }, { status: 400 });
    }
    
    // First try local knowledge base
    const knowledgeResponse = generateResponse(message);
    
    // If it's a default response, try web search
    if (knowledgeResponse.startsWith("I don't have specific information")) {
      try {
        const webResponse = await searchWeb(message);
        if (webResponse) {
          return NextResponse.json({ response: webResponse });
        }
      } catch (error) {
        console.error('Web search error:', error);
        // Fall back to local response if web search fails
      }
    }
    
    return NextResponse.json({ response: knowledgeResponse });
    
  } catch (error) {
    console.error('Error processing request:', error);
    return NextResponse.json(
      { error: 'Failed to process your request' },
      { status: 500 }
    );
  }
}

async function searchWeb(query: string): Promise<string | null> {
  try {
    // Extract main search terms
    const searchTerm = extractSearchTerm(query);
    
    // First try a direct Wikipedia API search
    try {
      // Wikipedia API to search for articles
      const searchResponse = await fetch(`${WIKIPEDIA_SEARCH_API}${encodeURIComponent(searchTerm)}&format=json&origin=*`);
      const searchData = await searchResponse.json();
      
      if (searchData.query && searchData.query.search && searchData.query.search.length > 0) {
        // Get the first result's title
        const title = searchData.query.search[0].title;
        
        // Now fetch the summary for that article
        const summaryResponse = await fetch(`${WIKIPEDIA_SUMMARY_API}${encodeURIComponent(title)}`);
        const summaryData = await summaryResponse.json();
        
        if (summaryData.extract) {
          return `Based on web search: ${summaryData.extract}\n\nSource: Wikipedia`;
        }
      }
    } catch (error) {
      console.error('Wikipedia search API error:', error);
    }
    
    // Try a fallback to a different source - Google Search API public alternative
    try {
      const response = await fetch(`https://serpapi.com/search.json?engine=google&q=${encodeURIComponent(searchTerm)}&api_key=demo`);
      
      if (response.ok) {
        const data = await response.json();
        
        // Extract organic results
        if (data.organic_results && data.organic_results.length > 0) {
          const firstResult = data.organic_results[0];
          return `Based on web search: ${firstResult.snippet}\n\nSource: ${firstResult.source}`;
        }
        
        // Extract knowledge graph if available
        if (data.knowledge_graph) {
          const kg = data.knowledge_graph;
          return `Based on web search: ${kg.description || kg.title}\n\nSource: Google Knowledge Graph`;
        }
      }
    } catch (error) {
      console.error('SerpAPI search error:', error);
    }
    
    // Final fallback to a general response
    return `I searched for information about "${searchTerm}" but couldn't find detailed results. This might be a specialized topic or require more specific terms.`;
  } catch (error) {
    console.error('Web search error:', error);
    return null;
  }
}

function extractSearchTerm(query: string): string {
  // Remove question words and other noise
  return query.toLowerCase()
    .replace(/^(what|who|when|where|why|how) (is|are|was|were|do|does|did|can|could|would|should) /i, '')
    .replace(/^(tell me about|explain|describe) /i, '')
    .replace(/\?/g, '')
    .trim();
}

function generateResponse(message: string): string {
  const lowerMessage = message.toLowerCase();
  
  // Check if the message is a greeting
  if (/^(hello|hi|hey|greetings)/i.test(lowerMessage)) {
    return "Hello! I'm your chatbot assistant. How can I help you today?";
  }
  
  // Check if asking about the bot
  if (/who are you|what are you/i.test(lowerMessage)) {
    return "I'm a chatbot built with Next.js and TypeScript. I can answer questions from my knowledge base and search the web for information I don't know!";
  }
  
  // Check if it's a farewell
  if (/goodbye|bye|see you/i.test(lowerMessage)) {
    return "Goodbye! Feel free to come back if you have more questions.";
  }
  
  // Check if it's a thank you
  if (/thank you|thanks/i.test(lowerMessage)) {
    return "You're welcome! Is there anything else you'd like to know?";
  }
  
  // Check if asking for time
  if (/what time|what is the time|current time/i.test(lowerMessage)) {
    return `The current time is ${new Date().toLocaleTimeString()}.`;
  }
  
  // Check if asking about capabilities
  if (/what can you do|help me with|what do you know/i.test(lowerMessage)) {
    return "I can answer questions about various technology topics from my knowledge base, and for other topics, I can search the web to find information. Just ask me anything!";
  }
  
  // Check for direct matches in knowledge base
  for (const [key, value] of Object.entries(knowledgeBase)) {
    if (lowerMessage.includes(key)) {
      return value;
    }
  }
  
  // Handle "what is X" questions
  const whatIsMatch = lowerMessage.match(/what is ([a-z\s]+)/i);
  if (whatIsMatch) {
    const topic = whatIsMatch[1].trim().replace(/\s+/g, '');
    if (knowledgeBase[topic]) {
      return knowledgeBase[topic];
    }
  }
  
  // Handle "how to" questions
  if (/how to|how do i|steps to/i.test(lowerMessage)) {
    const topic = extractTopic(lowerMessage);
    return generateHowToResponse(topic);
  }
  
  // Handle "why" questions
  if (/why is|why are|why does/i.test(lowerMessage)) {
    const topic = extractTopic(lowerMessage);
    return generateWhyResponse(topic);
  }
  
  // Default response for unknown queries
  return "I don't have specific information on that topic in my knowledge base, but I'll search the web for you!";
}

function extractTopic(message: string): string {
  // Remove question prefixes and other common words
  const topic = message.toLowerCase()
    .replace(/^(what is|what are|who is|how to|how do i|why is|why are|why does|how does|tell me about) /i, '')
    .replace(/\?/g, '')
    .trim();
  
  return topic;
}

function generateHowToResponse(topic: string): string {
  return `To work with ${topic}, you would typically follow these steps:

1. Learn the basic concepts and principles
2. Set up your development environment
3. Start with small, simple projects
4. Practice regularly and build increasingly complex applications
5. Use resources like documentation, tutorials, and community forums

For more specific guidance, I recommend looking at official documentation or specialized tutorials for ${topic}.`;
}

function generateWhyResponse(topic: string): string {
  return `${topic} is valuable in the tech industry for several reasons:

1. It solves specific problems efficiently
2. It's widely used and supported by a strong community
3. It has proven to be effective in real-world applications
4. It integrates well with other technologies
5. It continues to evolve and improve

The specific benefits depend on your use case and requirements.`;
} 