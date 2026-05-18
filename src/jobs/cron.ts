import { maintenanceModeJob } from "./maintenanceModeJob";

// using main thread to run cron jobs, if you have Heavy Tasks then consider using worker threads or child process
export const startCronJobs = () => {
  maintenanceModeJob();
};
