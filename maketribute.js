var Bot = require('./node_modules/twit/examples/bot');
var config = require('./config');
var createWordnok = require('wordnok').createWordnok;
var tributeDemander = require('./tributedemander');
var figurepicker = require('./figurepicker');
var prepphrasepicker = require('./prepphrasepicker');
var logger = require('./logger');
var handleTwitterError = require('./handletwittererror');
var emojiSource = require('emojisource');
var behavior = require('./behaviorsettings');
var probable = require('probable');
var callNextTick = require('call-next-tick');
var _ = require('lodash');
var canonicalizer = require('canonicalizer');
var createNounfinder = require('nounfinder');
var translator = require('./translator');
var relevantRelatedWordTypes = require('./relevant-related-word-types');

var bot = new Bot(config.twitter);

var simulationMode = (process.argv[2] === '--simulate');

logger.info('Tribute maker is running.');

var wordnok = createWordnok({
  apiKey: config.wordnikAPIKey,
  logger: {
    log: logger.info
  }
});

var isEmojiTopic = false;

var maxCommonnessForSecondary = behavior.maxCommonnessForReplyTopic[0] +
  probable.roll(
    behavior.maxCommonnessForSecondaryTopic[1] -
    behavior.maxCommonnessForSecondaryTopic[0]
  );

var primaryTopic;
var primaryDemand;

// TODO: Chain these with async.waterfall. Or refactor exhorter to handle both
// kinds of tributes.

function postTribute() {
  if (probable.roll(100) < behavior.emojiThresholdPercentage) {
    isEmojiTopic = true;
    postOnTopic(null, emojiSource.getRandomTopicEmoji());
  }
  else {
    wordnok.getTopic(postOnTopic);
  }
}

function postOnTopic(error, topic) {
  if (error) {
    logger.error(error);
    process.exit();
  }

  var forms = canonicalizer.getSingularAndPluralForms(topic);

  primaryTopic = forms[0];
  primaryDemand = getPrimaryDemand(primaryTopic, isEmojiTopic);

  if (isEmojiTopic) {
    callNextTick(makeDemands);
    return;
  }

  wordnok.getRelatedWords(
    {
      word: primaryTopic
    },
    makeDemands
  );
}

function makeDemands(relatedWordsError, relatedWords) {
  var tweetText = primaryDemand;

  if (relatedWordsError) {
    logger.error(relatedWordsError);
    process.exit();
  }
  else {
    getSecondaryDemand(relatedWords, appendDemandToTweet);
  }

  function appendDemandToTweet(error, secondaryDemand) {
    if (error) {
      logger.error(error);
      // An error is OK here. We can keep going.
    }

    if (secondaryDemand) {
      tweetText += ('! ' + secondaryDemand);
    }

    if (probable.roll(10) === 0) {
      translator.translateToRandomLocale(tweetText, 'en', tweetTranslation);
    }
    else {
      callNextTick(tweetAndRecord, tweetText);
    }

    function tweetTranslation(error, translation) {
      if (error) {
        logger.error(error);
        tweetAndRecord(tweetText);
      }
      else {
        tweetAndRecord(translation);
      }
    }
  }
}

function tweetAndRecord(tweetText) {
  if (simulationMode) {
    console.log('Would have tweeted', tweetText);
  }
  else {
    bot.tweet(tweetText, function reportTweetResult(error, reply) {
      logger.info((new Date()).toString(), 'Tweet posted', reply.text);
    });
  }
}

function getPrimaryDemand(topic, isEmoji) {
  var opts = {
    topic: topic,
    prepositionalPhrase: prepphrasepicker.getPrepPhrase(),
    tributeFigure: figurepicker.getMainTributeFigure(),
    isEmoji: isEmoji
  };

  if (isEmoji) {
    opts.repeatNTimesToPluralize = probable.roll(4) + probable.roll(4) + 2;
  }

  return tributeDemander.makeDemandForTopic(opts);
}

function getSecondaryDemand(relatedWords, done) {
  var nounfinder;

  if (relatedWords) {
    var relevantLists = _.values(_.pick(
      relatedWords, relevantRelatedWordTypes
    ));

    if (relevantLists.length > 0) {
      var topics = _.flatten(relevantLists);
      nounfinder = createNounfinder({
        wordnikAPIKey: config.wordnikAPIKey,
        memoizeServerPort: 4444
      });

      // TODO: Add nounfinder method that takes an array of words.
      nounfinder.getNounsFromText(topics.join(' '), filterForInterestingness);
      return;
    }
  }

  // Fell through? Call back with nothing.
  callNextTick(done);

  function filterForInterestingness(error, nouns) {
    if (error) {
      done(error);
    }
    else {
      nounfinder.filterNounsForInterestingness(
        nouns,
        maxCommonnessForSecondary,
        assembleSecondaryDemand
      );
    }
  }

  function assembleSecondaryDemand(error, nouns) {
    if (error) {
      done(error);
    }
    else {
      var demand;
      if (nouns.length > 0) {
        demand = tributeDemander.makeDemandForTopic({
          topic: probable.pickFromArray(nouns),
          prepositionalPhrase: prepphrasepicker.getPrepPhrase(),
          tributeFigure: figurepicker.getSecondaryTributeFigure()
        });
      }
      done(error, demand);
    }
  }
}

postTribute();
