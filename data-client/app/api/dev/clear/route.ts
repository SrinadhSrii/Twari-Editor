import chalk from "chalk";
import { NextResponse } from "next/server";
import database from "../../../lib/utils/database";

/*
    Clear Database API Route
    ------------------------
    This route handles the POST request from the client to clear the database.
    This endpoint is for development purposes only.
*/
export async function POST() {
  // Only allow in development
  if (process.env.NODE_ENV !== "development") {
    return NextResponse.json(
      { error: "Not available in production" },
      { status: 403 }
    );
  }

  try {
    // Clear the database
    await database.clearDatabase();
    console.log(
      "\n" + chalk.bold.green("=== Database cleared successfully ===") // Log a success message
    );

    // Return a success response to the client
    return NextResponse.json(
      { message: "Database cleared successfully" },
      { status: 200 }
    );
  } catch (error) {
    console.error("Error clearing database:", error); // Log an error message

    // Return an error response to the client
    return NextResponse.json(
      { error: "Failed to clear database" },
      { status: 500 }
    );
  }
}
