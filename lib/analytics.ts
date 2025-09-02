"use server";

export async function getDownloadCount(): Promise<number> {
  try {
    const response = await fetch('https://plausible.aqlan.dev/api/v2/query', {
      method: 'POST',
      headers: {
        'Authorization': 'Bearer '+ process.env.PLAUSIBLE_API_KEY,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        "site_id": "kwgn.aqlan.dev",
        "metrics": ["events"],
        "date_range": "all",
        "filters": [["is", "event:goal", ["Download"]]]
      }),
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const data = await response.json();
    return data.results?.[0]?.metrics?.[0] ?? 0;
  } catch (error) {
    console.error('Failed to fetch download count:', error);
    return 0;
  }
}
