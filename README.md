This simple extention allows you to query ESV (English Standard Version) Bible verses from ESV.org and insert them as blocks.

## API Token

**We will be required to created an account on [api.ESV.org](https://api.ESV.org) and generate an API token.**

## To use this extension:

1) Enter a bible verse/chapter or ranges as a text block or a title of a page. 
2) Trigger this using the command palette using the "ESV Bible" command.

## Examples of Accepted Passage Queries

The API does a good job in figuring out the passage you're searching for.

* John 1:1
* jn11.35
* Genesis 1-3
* 43011035
* 01001001-01011032
* John1.1;Genesis1.1
* 19001001-19001006,19003001-19003008

## Example Output
![Example Screenshot](/docs/screenshot.png)

## Screencast

[![ESV Bible Extension Screencast](https://img.youtube.com/vi/bbff2xugHeo/0.jpg)](https://www.youtube.com/watch?v=bbff2xugHeo)

## Fequently Asked Questions

### Why did you create this extension?

I use Roam as a first-principle repository and thinking tool. As a Christian, the Bible is a first-principle source that I continually study and I want it be easily accessible as Kindle book notes.

I was tired of copying and pasting from other apps or websites and I wanted an easy way to insert Bible verses.

I also didn't want to import the whole Bible graph and only wanted to import individual Bible chapters/verses that I'm studying or engaging with at the moment.

### Why did I choose the ESV version of the Bible?

There are not many modern translations of the Bible with API access. My preferred Bible translation is the New International Version (NIV), but Zondervan/Biblica does not make the NIV version available.

The folks behind the ESV have graciously made the ESV.org available for easy API query. If the NIV version or another version provides an easy API to query, I am happy to include them as options.

### Can you implement another Bible version?

If you have another Bible translation/version you would like to query, please submit a pull request or create an issue (feature request).

### Why are the verses inserted as separate blocks instead of a single block?

By inserting each verse as a block, you can refer to specific Bible verses in your literature notes. I will typically query/insert a whole chapter, then block reference specific verses mentioned in Sermons or notes that I am taking.


