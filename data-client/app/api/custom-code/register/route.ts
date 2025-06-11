import { NextRequest, NextResponse } from "next/server";
import { WebflowClient } from "webflow-api";
import { ScriptController } from "../../../lib/controllers/scriptControllers";
import jwt from "../../../lib/utils/jwt";

// Get Registered Scripts
export async function GET(request: NextRequest) {
  try {
    const accessToken = await jwt.verifyAuth(request);
    if (!accessToken) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const siteId = searchParams.get("siteId");

    if (!siteId) {
      return NextResponse.json(
        { error: "Site ID is required" },
        { status: 400 }
      );
    }

    const webflow = new WebflowClient({ accessToken });
    const scriptController = new ScriptController(webflow);
    const registeredScripts = await scriptController.getRegisteredScripts(
      siteId
    );

    return NextResponse.json({ registeredScripts }, { status: 200 });
  } catch (error) {
    console.error("Error fetching registered scripts:", error);
    return NextResponse.json(
      { error: "Failed to register custom code" },
      { status: 500 }
    );
  }
}

// Register Custom Code
export async function POST(request: NextRequest) {
  try {
    // Verify authentication
    const accessToken = await jwt.verifyAuth(request);
    if (!accessToken) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Get Request Body
    const { siteId, isHosted, scriptData } = await request.json();
    const scriptType = isHosted ? "hosted" : "inline";

    // Create Webflow Client
    const webflow = new WebflowClient({ accessToken });
    const scriptController = new ScriptController(webflow);

    let result;
    if (scriptType === "inline") {
      result = await scriptController.registerInlineScript(siteId, scriptData);
    } else if (scriptType === "hosted") {
      result = await scriptController.registerHostedScript(siteId, scriptData);
    } else {
      return NextResponse.json(
        { error: "Invalid script type" },
        { status: 400 }
      );
    }
    return NextResponse.json({ result }, { status: 200 });
  } catch (error) {
    console.error("Error registering custom code:", error);
    return NextResponse.json(
      { error: "Failed to register custom code" },
      { status: 500 }
    );
  }
}
