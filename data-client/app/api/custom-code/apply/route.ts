import { NextRequest, NextResponse } from "next/server";
import { WebflowClient } from "webflow-api";
import { ScriptController } from "../../../lib/controllers/scriptControllers";
import jwt from "../../../lib/utils/jwt";

// Apply Custom Code
export async function POST(request: NextRequest) {
  try {
    // Clone and log only the request body
    const clonedRequest = request.clone();
    const body = await clonedRequest.json();
    console.log("Request body:", body);

    const accessToken = await jwt.verifyAuth(request);
    if (!accessToken) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Get Request Body
    const { targetType, targetId, scriptId, location, version } = body;
    console.log(targetType, targetId, scriptId, location, version, "body");

    // Validate Request Body
    if (!targetType || !targetId || !scriptId || !location || !version) {
      return NextResponse.json(
        { error: "Missing required fields" },
        { status: 400 }
      );
    }

    // Create Webflow Client
    const webflow = new WebflowClient({ accessToken });
    const scriptController = new ScriptController(webflow);

    // Apply Custom Code
    let result;

    if (targetType === "site") {
      // Upsert Custom Code to Site
      result = await scriptController.upsertSiteCustomCode(
        targetId,
        scriptId,
        location,
        version
      );
    } else if (targetType === "page") {
      // Upsert Custom Code to Page
      result = await scriptController.upsertPageCustomCode(
        targetId,
        scriptId,
        location,
        version
      );
    } else {
      return NextResponse.json(
        { error: "Invalid target type" },
        { status: 400 }
      );
    }

    // Return Result
    return NextResponse.json({ result }, { status: 200 });
  } catch (error) {
    console.error(
      "Error applying custom code:",
      error instanceof Error ? error.message : error
    );
    return NextResponse.json(
      { error: "Failed to apply custom code" },
      { status: 500 }
    );
  }
}
