export const environment = {
  production: false,
  // Confirmed directly against the running backend (application.yml +
  // the live listening process): 8081. An earlier session change to
  // 8080 was based on a different, older backend instance and was
  // incorrect for the current one — do not change this without
  // re-confirming against the backend that's actually running.
  apiBaseUrl: 'http://localhost:8081',
};
