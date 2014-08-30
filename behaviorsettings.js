module.exports = {
  exhortTestSubjectUserId: 129586119,
  hoursToWaitBetweenRepliesToSameUser: 38.5,
  maxAttemptsToReplyPerUserPerRun: 1,

  // Everything in the lists should be lowercase. Potential matches will also 
  // be converted to lowercase.

  falsePositivesList: [
    'rt',
    'http',
    'haha',
    'adv',
    'san'
  ],
  buzzkillBlacklist: [
    'negro',
    'negroes',
    'chink',
    'chinks',
    'gook',
    'gooks',
    'nigger',
    'niggers',
    'nigga',
    'niggas',
    'spic',
    'spics',
    'rape',
    'rapes',
    'rapist',
    'rapists',
    'bombing',
    'bombings',
    'shootings',
    'shooting'
  ],
  tragedyModeBlacklist: [
    'gaza',
    'israel',
    'palestine',
    'invasion',
    'horror',
    'genocide',
    'explosion',
    'assault',
    'hamas',
    'bomb',
    'plane',
    'death',
    'missile',
    'crash',
    'passenger',
    'suicide',
    'airstrike',
    'brigadier',
    'idf',
    'isis',
    'mourner',
    'mourners',
    'rebel',
    'iraq',
    'accident',
    'ebola',
    'depression',
    'asphyxiation',
    'ferguson'
  ],
  tragedyHappenedRecently: true,
  maxCommonnessForReplyTopic: [20, 40]
};
