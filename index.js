const express = require("express");
const cors = require("cors");
const puppeteer = require("puppeteer");
require("dotenv").config({ path: "./.ENV" });

const app = express();
app.use(cors({ origin: true }));
app.use(express.json());

app.get("/", async (req, res) => {
	res.send("Welcome to this Weird API!");
	res.end();
});

app.get("/harks-list-search/:city/:text", async (req, res) => {
	try {
		const searchText = req.params.text;
		const searchCity = req.params.city;

		if (searchCity.trim() !== "" || searchText.trim() !== "") {
			const browser = await puppeteer.launch({args: ['--no-sandbox', '--disable-setuid-sandbox']});

			const page = await browser.newPage();

			await page.goto(process.env.WEBSITE_URL);

			await page.type('[name="search-text"]', searchText.trim().replace("+", " "));

			await page.select('select[name="search-country"]', searchCity.trim());

			await page.click('[type="submit"]');

			await page.waitForSelector('div.card', {
				visible: true,
			});

			await page.waitFor(5000);

			// Results

			const result = await page.evaluate(() => {
				const numberOfResults = document.querySelectorAll("div.card").length;

				const allImages = document.querySelectorAll("div.card-image a img");
				const allContents = document.querySelectorAll("div.card-content p");
				const allUrls = document.querySelectorAll("div.card-action a");

				const images = Array.from(allImages).map((element) => element.src);
				const contents = Array.from(allContents).map(
					(element) => element.textContent
				);
				const urls = Array.from(allUrls).map((element) => element.href);

				const results = [];

				for (let i = 0; i < numberOfResults; i++) {
					results.push({
						image: images[i],
						content: contents[i],
						url: urls[i],
					});
				}

				const result = {
					numberOfResults,
					results,
				};

				return result;
			});

			const search = {
				searchText: searchText.replace("+", " "),
				searchCity,
			};

			res.json({ search, ...result });
			return res.end();
		} else {
			res.send("Error: There is no search text/city supplied!");
			return res.end();
		}
	} catch (err) {
		console.error(err);
	}
});

const port = process.env.PORT || 3000;

app.listen(port, () => {
	console.log(`Listening on port ${port}...`);
});
