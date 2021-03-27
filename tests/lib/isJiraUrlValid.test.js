import isJiraUrlValid from '../../src/lib/isJiraUrlValid.js';

test('checks if JIRA project URL is valid', () => {
  isJiraUrlValid('invalidURL').then(({ isValid }) => expect(isValid).toBe(false));
  isJiraUrlValid('https://quijis.net').then(({ isValid }) => expect(isValid).toBe(false));
  isJiraUrlValid('https://quijis.atlassian.com').then(({ isValid }) => expect(isValid).toBe(false));
  isJiraUrlValid('https://atlassian.com').then(({ isValid }) => expect(isValid).toBe(false));
  isJiraUrlValid('https://.atlassian.com').then(({ isValid }) => expect(isValid).toBe(false));
  isJiraUrlValid('http://quijis.atlassian.net/').then(({ isValid }) => expect(isValid).toBe(true));
  isJiraUrlValid('http://quijis.atlassian.net').then(({ isValid }) => expect(isValid).toBe(true));
  isJiraUrlValid('https://quijis.atlassian.net/').then(({ isValid }) => expect(isValid).toBe(true));
  isJiraUrlValid('https://quijis.atlassian.net').then(({ isValid }) => expect(isValid).toBe(true));
});
