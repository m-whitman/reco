const express = require("express");
const router = express.Router();
const searchService = require('./searchService');

router.get("/", async (req, res) => {
  const { query } = req.query;

  const result = await searchService.searchAndGetRecommendations(query);

  console.log(` `);

  if (result.error) {
    res
      .status(result.error === "No matching track found" ? 404 : 500)
      .json({ error: result.error });
  } else {
    res.json(result);
  }
});

module.exports = router;
