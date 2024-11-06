const express = require("express");
const router = express.Router();
const searchService = require('./searchService');

router.get("/", async (req, res) => {
  const { query } = req.query;

  if (!query) {
    return res.status(400).json({ error: "Search query is required" });
  }

  try {
    const result = await searchService.searchAndGetRecommendations(query);

    if (result.error) {
      console.error(`Search error for query "${query}":`, result.error);
      return res.status(result.error === "No matching track found" ? 404 : 500)
        .json({ error: result.error });
    }

    res.json(result);
  } catch (error) {
    console.error(`Server error for query "${query}":`, error);
    res.status(500).json({ 
      error: "An internal server error occurred",
      details: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

module.exports = router;
