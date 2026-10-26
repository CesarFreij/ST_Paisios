const actionPointDefaults = Object.freeze({
  prayer: 5,
  fasting: 5,
  bible: 10,
  church: 8,
  goodDeed: 7,
})

const pointSettingFields = Object.freeze({
  prayer: 'prayerPoints',
  fasting: 'fastingPoints',
  bible: 'biblePoints',
  church: 'churchPoints',
  goodDeed: 'goodDeedPoints',
})

const dailyQuestionDefaultPoints = 1
const perfectMonthRewardPoints = 1000

module.exports = {
  actionPointDefaults,
  pointSettingFields,
  dailyQuestionDefaultPoints,
  perfectMonthRewardPoints,
}
