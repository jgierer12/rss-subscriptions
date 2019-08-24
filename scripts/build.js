const { readFile, writeFile } = require(`fs`).promises;
const { resolve } = require(`path`);
const pify = require(`pify`);
const opmlToJson = pify(require(`opml-to-json`));
const handlebars = require(`handlebars`);

const [subscriptionsFile, templateFile, outputFile] = [
  `subscriptions.xml`,
  `README.hbs.md`,
  `README.md`,
].map(name => resolve(process.cwd(), name));

const getTags = async () => {
  console.info(`Parsing subscriptions (${subscriptionsFile})`);

  const opml = await readFile(subscriptionsFile);
  const json = await opmlToJson(opml.toString());

  let tags = json.children.filter(item => item.hasOwnProperty(`children`));
  const feeds = json.children.filter(item => item[`#type`] === `feed`);
  const untaggedFeeds = feeds.filter(
    feed => !tags.some(i => i.children.find(j => j.xmlurl === feed.xmlurl)),
  );

  if (untaggedFeeds.length > 0) {
    tags.push({
      title: `Other`,
      children: untaggedFeeds,
    });
  }

  return tags;
};

const getTemplate = async () => {
  console.info(`Parsing README template (${templateFile})`);

  const hbs = await readFile(templateFile);
  return handlebars.compile(hbs.toString());
};

const render = async (template, tags) => {
  console.info(`Rendering template`);

  return template({ tags });
};

const writeResult = async res => {
  console.info(`Writing result to ouput file (${outputFile})`);

  return writeFile(outputFile, res);
};

(async () => {
  try {
    const [tags, template] = await Promise.all([getTags(), getTemplate()]);
    const res = await render(template, tags);
    await writeResult(res);
  } catch (err) {
    console.error(err);
  }
})();
