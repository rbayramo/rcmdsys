require("dotenv").config();
const OpenAI = require("openai");
const express = require("express");
const cors = require("cors");
const multer = require("multer");
const upload = multer();

const { OPENAI_API_KEY } = process.env;

const app = express();
const PORT = process.env.PORT || 5000;

// Enable CORS for your front-end.
// const corsOptions = {
//   origin: "https://783e-212-47-144-142.ngrok-free.app",
// };

app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

/*
  Create an OpenAI client instance. To use the beta API version for assistants,
  we pass the beta header "OpenAI-Beta: assistants=v2" in the configuration.
*/
const openai = new OpenAI({
  apiKey: OPENAI_API_KEY,
  defaultHeaders: {
    "OpenAI-Beta": "assistants=v2",
  },
});

// ---------------------- New File Upload Endpoint ----------------------
// This endpoint accepts a file upload and returns a file_id.
// The file is uploaded with purpose "assistants".
app.post("/api/upload", upload.single("file"), async (req, res) => {
  try {
    // Upload the file to OpenAI.
    // Note: Depending on your OpenAI SDK version, you may need to adjust this call.
    const fileUploadResponse = await openai.files.create({
      file: req.file.buffer,
      filename: req.file.originalname,
      purpose: "assistants",
    });
    // console.log("File uploaded, file_id:", fileUploadResponse.data.id);
    res.status(200).json({ file_id: fileUploadResponse.data.id });
  } catch (error) {
    console.error("Error uploading file:", error);
    res.status(500).json({ error: "Error uploading file" });
  }
});
// ------------------------------------------------------------------------

/* 
  POST route for handling messages.
  Expects:
    - page: e.g. "ILB1", "ILB2", etc.
    - conversation: an array of conversation pairs (if any)
    - newMessage: the new user message
    - thread_id: (optional) previously stored thread id
    - attachments: (optional) array of attachments (each should include file_id and tools)
*/
app.post("/api/message", async (req, res) => {
  // console.log("Received request body:", req.body);
  
  const { page, conversation, newMessage, thread_id, attachments } = req.body;
  
  // Determine the thread id: use provided one if nonempty, else create a new thread.
  let threadId = thread_id && thread_id.trim() !== "" ? thread_id : "";
  
  if (!threadId) {
    try {
      const myThread = await openai.beta.threads.create();
      // console.log("New thread created with ID:", myThread.id);
      threadId = myThread.id;
    } catch (error) {
      console.error("Error creating thread:", error);
      res.status(500).json({ error: "Internal server error" });
      return;
    }
  }

  // Select the appropriate assistant ID based on the page.
  let assistantIdToUse;
  if (page === "ILB1") {
    assistantIdToUse = process.env.ASSISTANT_ID_ILB1;
  } else if (page === "ILB2") {
    assistantIdToUse = process.env.ASSISTANT_ID_ILB2;
  } else if (page === "ILB3") {
    assistantIdToUse = process.env.ASSISTANT_ID_ILB3;
  } else if (page === "ILB4") {
    assistantIdToUse = process.env.ASSISTANT_ID_ILB4;
  }

  // If the assistant for the requested page is not available, return a message.
  if (!assistantIdToUse || assistantIdToUse.trim() === "") {
    return res.status(200).json({
      response: "This Assistant is not available yet! Please check back in couple of days.",
      thread_id: threadId,
    });
  }

  try {
    // Create the user message, including attachments if provided.
    const messagePayload = {
      role: "user",
      content: newMessage,
    };
    if (attachments && attachments.length > 0) {
      messagePayload.attachments = attachments;
    }
    
    const myThreadMessage = await openai.beta.threads.messages.create(threadId, messagePayload);
    // console.log("User message added:", myThreadMessage);
    
    // Run the Assistant on the thread.
    const myRun = await openai.beta.threads.runs.create(threadId, {
      assistant_id: assistantIdToUse,
      instructions:
        "",
      // Optionally, add tools if needed.
      // tools: [ { type: "code_interpreter" }, { type: "file_search" } ],
    });
    // console.log("Run created:", myRun);
    
    // Poll until the run is completed.
    const retrieveRun = async () => {
      let currentRun = await openai.beta.threads.runs.retrieve(threadId, myRun.id);
      // console.log("Initial run status:", currentRun.status);
      while (currentRun.status !== "completed") {
        currentRun = await openai.beta.threads.runs.retrieve(threadId, myRun.id);
        // console.log(`Run status: ${currentRun.status}`);
        if (currentRun.status === "completed") break;
        await new Promise((resolve) => setTimeout(resolve, 5000));
      }
      return currentRun;
    };
    
    await retrieveRun();
    
    // Retrieve the assistant's message from the thread.
    const allMessages = await openai.beta.threads.messages.list(threadId);
    const assistantMsg = allMessages.data.find((msg) => msg.role === "assistant");
    const assistantResponse = assistantMsg ? assistantMsg.content[0].text.value : "No response from assistant.";
    
    // console.log("Assistant response:", assistantResponse);
    const cleanedAssistantResponse = assistantResponse.replace(/【.*?】/g, '');
    res.status(200).json({
      response: cleanedAssistantResponse,
      thread_id: threadId,
    });
  } catch (error) {
    console.error("Error processing message:", error);
    res.status(500).json({ error: "Internal server error" });
  }
});


app.get('/', (req, res) => {
  res.send('Server is running'); // Or serve your frontend
});

app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});
