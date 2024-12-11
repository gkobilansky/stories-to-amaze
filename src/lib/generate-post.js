import OpenAI from "openai";
import fs from 'fs';
import { writeFile } from "fs/promises";
import { Readable } from "stream";
import path from 'path';
import dotenv from 'dotenv';

dotenv.config();

// Set up OpenAI configuration
const openai = new OpenAI({
    organization: "org-fyaTvzwWQ174TwmxNdjpVNaK",
    apiKey: process.env.OPENAI_API_KEY,
});

// Function to generate a post with a refined prompt
async function generatePost(productName, productDescription) {
    const prompt = `
    Write a short, engaging, and slightly irreverent story where the product "${productName}" is used by one of the characters as a tool. The product should not be the main focus of the story. Instead, create a compelling narrative with interesting characters and a unique plot. The story should be entertaining and draw readers in with its humor and wit. Ensure the product is integrated seamlessly into the storyline, enhancing the plot but not overshadowing it. Return the story in markdown format. The output should include the following fields: post_status: publish
    post_author: 1
    post_title: ""
    post_content: ""
    post_category: ""
    tags_input: ""
    `;

    const response = await openai.chat.completions.create({
        messages: [{ role: "system", content: prompt }],
        model: "gpt-4o",
      });

    console.log(response)

    return response.choices[0].message.content.trim();
}

async function generateSummary(postContent) {
    const summaryPrompt = `
    Summarize the following story in a concise manner that captures the main plot and highlights the key scenes:
    ${postContent}
    `;

    const response = await openai.chat.completions.create({
        messages: [{ role: "system", content: summaryPrompt }],
        model: "gpt-4o",
      });

    console.log(response)

    return response.choices[0].message.content.trim();
}

function generateImagePrompt(postContent) {
    const scenePrompt = `
    Based on the following story, generate a scene that captures an exciting moment and could be used as a featured image:
    ${postContent}
    `;

    return scenePrompt;
}

async function generateImage(prompt) {
    const response = await openai.images.generate({
        model: 'dall-e-3',
        prompt: prompt,
        n: 1,
        size: '1024x1024'
    });

    console.log(response)

    const imageUrl = response.data[0].url;
    const imageResponse = await fetch(imageUrl)

    return imageResponse;
}

// List of products
const products = [
    { name: "Instant Pot Duo 7-in-1 Electric Pressure Cooker", description: "A versatile and popular kitchen appliance" },
    // Add more products as needed
];

// Generate and save posts
async function generatePosts() {
    for (let i = 0; i < products.length; i++) {
        const product = products[i];
        const postContent = await generatePost(product.name, product.description);
        
        // Save post content to a file
        const postFilename = path.join('posts', `post_${i + 1}.txt`);
        fs.writeFileSync(postFilename, postContent, 'utf8');

        // Generate summary based on post content
        const postSummary = await generateSummary(postContent);

        // Generate image prompt based on post content
        const imagePrompt = generateImagePrompt(postSummary);

        // Generate image
        const imageData = await generateImage(imagePrompt);
        const imageFilename = path.join('images', `image_${i + 1}.png`);
        const body = Readable.fromWeb(imageData.body)
        await writeFile(imageFilename, body)

        console.log(`Generated post ${i + 1}: ${postFilename}`);
        console.log(`Generated image ${i + 1}: ${imageFilename}`);
    }
}

generatePosts().catch(console.error);
