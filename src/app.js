import Twit from 'twit'
require('dotenv').config()

const CHECK_INTERVAL = 300000 // 5 minutes
const HASH_TAG = '#100DaysOfHomeLab'
const RESULTS_COUNT = 25
const LANGUAGE = 'en'
const RESULT_TYPE = 'recent'
const tweetedIdList = []
const ignoredPhrases = ['hacked', 'hacker', 'bitcoin']

console.log('Started twitter bot')

const TwitBot = new Twit({
  consumer_key: process.env.CONSUMER_KEY,
  consumer_secret: process.env.CONSUMER_SECRET,
  access_token: process.env.ACCESS_TOKEN,
  access_token_secret:
    process.env.ACCESS_TOKEN_SECRET
})

const reTweet = async searchText => {
  const params = {
    q: searchText + '',
    result_type: RESULT_TYPE,
    count: RESULTS_COUNT,
    lang: LANGUAGE
  }

  try {
    console.log('Searching for tweets')
    const resp = await TwitBot.get('search/tweets', params)
    const tweets = resp.data.statuses
    let tweetIdList = []
    tweets.forEach(tweet => {
      // check to see if it's in memory
      if (tweetedIdList.includes(tweet.id_str)) {
        console.log(`Found tweet in tweetedIdList, will not tweet ${tweet.id_str}`)
        return
      }

      // check if tweet text contains a phrase we want to ignore
      ignoredPhrases.every((phrase) => {
        if (tweet.text.toLowerCase().includes(phrase)) {
          console.log(`Found ignored phrase in tweet text, will not tweet ${tweet.id_str}`)
        }
      })

      tweetIdList.push(tweet.id_str)

      // Check to see if we've already retweeted
      if (tweet.text.startsWith('RT @')) {
        if (tweet.retweeted_status) {
          tweetIdList.push(tweet.retweeted_status.id_str)
        } else {
          tweetIdList.push(tweet.id_str)
        }
      } else {
        tweetIdList.push(tweet.id_str)
      }
    })

    // filter to unique
    tweetIdList = tweetIdList.filter((x, i, a) => a.indexOf(x) === i)

    if (tweetIdList && tweetIdList.length > 0) {
      tweetIdList.forEach(async tweetId => {
        try {
          await TwitBot.post('statuses/retweet/:id', { id: tweetId })
          console.log(`Retweeted tweetID: ${tweetId}`)
          tweetedIdList.push(tweetId)
        } catch (error) {
          console.error(`This has probably already been tweeted. tweetId: ${tweetId} error: ${error}`)
          tweetedIdList.push(tweetId)
        }
      })
    } else {
      console.log(`No new tweets that haven't already been tweeted tweetIdList length: ${tweetIdList.length}`)
    }
  } catch (error) {
    console.error(`Error while searching error: ${error}`)
    process.exit(1)
  }
}

setInterval(() => {
  reTweet(HASH_TAG)
}, CHECK_INTERVAL)
