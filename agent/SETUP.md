# Dashboard setup, click by click

Time: about 45 minutes. Do the parts in order. Stop at any step that does not match your screen, take a screenshot, and send it to me.

A caveat: I cannot open your dashboard. The labels below come from the ElevenLabs documentation. Where the docs do not name a button, I say "look for".

Your Starter plan includes 75 call minutes a month. Every test call uses them. Do not chat with the agent for fun yet.

---

## Part A. Create the agent (3 minutes)

1. Open `https://elevenlabs.io/app/agents` and sign in.
2. Click the button to create a new agent. Look for "New agent" or a plus sign.
3. Name: `Ambulance Helpline (demo)`.
4. Choose **Blank template**. If it asks for an industry or use case, skip it or pick anything. We replace the prompt anyway.
5. Click create. You land on the agent's settings page, with tabs across the top.

## Part B. First message and system prompt (3 minutes)

You are on the **Agent** tab.

1. Find the box labelled **First message**. Delete what is there. Paste exactly this, curly braces included:
   `{{opening_line}}`
   The curly braces mark a blank that the web page fills in at the start of each call.
2. Find the box labelled **System prompt**. Delete everything in it.
3. Open `system_prompt.md`. Select all, copy, paste into the box.
4. Saving: there may be no Save button. The dashboard may save as you type, or show a "Publish" button at the top right once you change something. If you see Publish, click it after each part.
5. Skip dynamic variable placeholders. The web page fills the blanks on every call, so they are not needed. Side effect: in the dashboard's own test, the agent may read its first line oddly. Ignore that.

## Part C. Languages (5 minutes)

Still on the **Agent** tab.

1. Find the language setting. The default should say **English**. Leave it.
2. Find **Additional languages** and add **Hindi**.
4. If the dashboard offers a separate first message per language, leave them all as `{{opening_line}}`. The web page supplies the line in the right language.

## Part D. The AI model (2 minutes)

Still on the **Agent** tab.

1. Find the dropdown labelled **LLM**. This is the AI model that does the thinking.
2. Pick the most capable model in the list, not the one marked fastest or cheapest. If you are unsure, tell me the names you see and I will choose.
3. If there is a **Temperature** slider, drag it close to the left (low). Low means the agent sticks to the script.

## Part E. Knowledge base (3 minutes)

1. Open `knowledge_base.md` on your computer. Delete the second line, the one that says "Delete this line before upload". Save.
2. In the dashboard, find the **Knowledge Base** section on the Agent tab.
3. Click the button to add a document. Choose the file upload option. Upload `knowledge_base.md`.
4. If it refuses the file type, rename the file to `knowledge_base.txt` and upload again.

## Part F. Voice (3 minutes)

1. Click the **Voice** tab.
2. Choose a voice. Use the search or filter to find one tagged Hindi or Indian accent. Pick a calm one.
3. Note the name of the voice model shown on this tab (for example Flash, Turbo, v3). Send it to me.

## Part G. Tools (20 minutes, the longest part)

A tool is an action the agent can take during a call, like filling the on-screen card. You will add five of your own and switch on two built-in ones.

Open `client_tools.md` and keep it beside the dashboard.

### Add the five client tools

Repeat these steps for each tool in `client_tools.md`:

1. On the **Agent** tab, find the **Tools** section. Click **Add tool**.
2. Set **Tool Type** to **Client**.
3. **Name:** copy it exactly, including capital letters. Example: `updateDispatchCard`.
4. **Description:** copy the description line from the file.
5. **Wait for response:** tick it only for `findNearestHelp`. Leave it off for the other four.
6. For each row in that tool's parameter table, click the button to add a parameter and fill in:
   - **Data Type:** String
   - **Identifier:** the name in the first column, for example `location_text`
   - **Required:** as stated in the heading or table for that tool in `client_tools.md`.
   - **Description:** the text in the description column
7. Save the tool.

Counts, so you can check yourself: `updateDispatchCard` 13, `findNearestHelp` 4, `bookAmbulance` 1, `reportOperatorResponse` 3, `handOffToDispatcher` 2.

### Switch on the two built-in tools

1. Click **Add tool** again.
2. In the list you should see ready-made system tools. Add **Language detection** (it may show as "Detect language"). Leave its description blank.
3. Add **End call** the same way.

## Part H. Make it usable on a web page (2 minutes)

1. Click the **Advanced** tab.
2. Find the authentication setting. Turn it **off**. The web widget only works with authentication off.
3. Leave the **Security** tab alone for now. We add an allowed-domain list after the site is live.

## Part I. Send me three things

1. The **agent ID**. It starts with `agent_`. Look in the browser address bar while the agent is open, or for a copy icon next to the agent name.
2. The voice model name from Part F.

## Part J. One short test (2 minutes of your 75)

1. Click **Test AI agent**.
2. Say in Hindi that your father has chest pain. Answer two questions. Then switch to English for one answer. Hang up.
3. Tell me: did it open with "Ambulance helpline, demo line", go to location first, ask one question at a time, and follow you into English?

Expect the card tools to fail or stall here. They need the web page, which I build next. That is normal.

## Part K. After the site is live (5 minutes)

1. **Security tab, allowlist:** add `vedantm1049.github.io`. Only that site can then start calls with your agent. Add `localhost:8000` too if you want to run it on your computer.
2. **Security tab, overrides:** if you see an override switch for **Language**, turn it on. It lets the callback start in Hindi from the first word. If it is not there, skip it. The page falls back to English and the agent switches after the first reply.
3. **Max call length:** if you find a setting for maximum conversation duration, set it to 4 minutes. It stops a stuck or abused call from eating your 75 minutes.
4. **First message:** confirm it says exactly `{{opening_line}}`. The page fills it for each call.
