import { WebflowClient } from "webflow-api";
import { ScriptController } from "../../../lib/controllers/scriptControllers";
import jwt from "../../../lib/utils/jwt";
import { NextRequest, NextResponse } from "next/server";

interface Script {
  id: string;
  location?: string;
}

export async function GET(request: NextRequest) {
  try {
    // Add auth verification
    const accessToken = await jwt.verifyAuth(request);
    if (!accessToken) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { targetType, targetId, targetIds } = await validateRequest(request);
    const webflow = new WebflowClient({
      accessToken: accessToken, // Use the verified access token
    });
    const scriptController = new ScriptController(webflow);

    const result = await getCustomCodeStatus(
      scriptController,
      targetType,
      targetId,
      targetIds || null
    );

    return NextResponse.json({ result }, { status: 200 });
  } catch (error) {
    return handleError(error as Error);
  }
}

async function validateRequest(request: NextRequest) {
  const accessToken = await jwt.verifyAuth(request);
  if (!accessToken) {
    throw new Error("Unauthorized");
  }

  const { searchParams } = new URL(request.url);
  const targetType = searchParams.get("targetType");
  const targetId = searchParams.get("targetId");
  const targetIds = searchParams.get("targetIds")?.split(",");

  if (!targetType || (!targetId && !targetIds)) {
    throw new Error("Missing required fields");
  }

  return { targetType, targetId, targetIds };
}

async function getCustomCodeStatus(
  scriptController: ScriptController,
  targetType: string,
  targetId: string | null,
  targetIds: string[] | null
) {
  if (targetType === "site") {
    return scriptController.getSiteCustomCode(targetId!);
  }

  if (targetType === "page" && targetIds) {
    const results = await scriptController.getMultiplePageCustomCode(targetIds);
    return formatPageResults(results);
  }

  if (targetType === "page" && targetId) {
    const scripts = await scriptController.getPageCustomCode(targetId);
    return formatSinglePageResult(scripts);
  }

  throw new Error("Invalid target type");
}

function formatPageResults(results: Map<string, Script[]>) {
  const formatted: Record<string, Record<string, Script>> = {};
  for (const [pageId, scripts] of results) {
    formatted[pageId] = {};
    scripts.forEach((script) => {
      formatted[pageId][script.id] = {
        id: script.id,
        location: script.location,
      };
    });
  }
  return formatted;
}

function formatSinglePageResult(
  scripts: Array<{ id: string; location?: string }>
) {
  const result: Record<string, { id: string; location?: string }> = {};
  scripts.forEach((script) => {
    result[script.id] = {
      id: script.id,
      location: script.location,
    };
  });
  return result;
}

function handleError(error: Error) {
  console.error("Error in status route:", error);
  const status = error.message === "Unauthorized" ? 401 : 500;
  const message =
    error.message === "Unauthorized" ? "Unauthorized" : "Internal server error";
  return NextResponse.json({ error: message }, { status });
}
