import { createServer, IncomingMessage, ServerResponse } from "http";
import next from "next";
import { setupDevEnvironment } from "../app/lib/utils/ngrokManager";

async function dev() {
  const app = next({ dev: true });
  const handle = app.getRequestHandler();

  await app.prepare();

  const server = createServer(
    async (req: IncomingMessage, res: ServerResponse) => {
      try {
        await handle(req, res);
      } catch (err) {
        console.error("Error handling request:", err);
        res.statusCode = 500;
        res.end("Internal Server Error");
      }
    }
  );

  server.listen(3000, async () => {
    console.log("> Ready on http://localhost:3000");
    await setupDevEnvironment();
  });
}

dev().catch((err) => {
  console.error("Error starting server:", err);
  process.exit(1);
});
