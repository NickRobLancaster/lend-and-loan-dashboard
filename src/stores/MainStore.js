import axios from "axios";
// src/stores/counter.js
import { defineStore } from "pinia";
import dayjs from "dayjs";
import isBetween from "dayjs/plugin/isBetween";
import { color } from "chart.js/helpers";

dayjs.extend(isBetween);

export const useMainStore = defineStore("main", {
  state: () => ({
    test_mode: false,

    toasts: [
      // test toast
      // {
      //   title: "Saved Successfully",
      //   message: "This is a test message",
      // },
    ],

    boasts: [],

    // loading spinner
    refreshing: false,

    // state data
    is_active: true,

    settings: {
      debt_goal: (
        JSON.parse(localStorage.getItem("settings")) || { debt_goal: 500000 }
      ).debt_goal,
    },

    // company object
    company: {
      name: "Lend and Loan Financial",
      address: "123 Bristol Street",
      phone: "555-555-5555",
      email: "info@lendandloan.com",
      website: "www.lendandloan.com",

      // company logo
      logo: "https://via.placeholder.com/150",
    },

    // togglers
    show_settings: false,
    show_users: false,
    show_enrollments: false,
    show_uploads: false,

    time_range_period: localStorage.getItem("time_range_period") || "month",
    start_date: "",
    end_date: "",

    spiffs: JSON.parse(localStorage.getItem("spiffs")) || [],

    users: JSON.parse(localStorage.getItem("users")) || [],
    enrollments: JSON.parse(localStorage.getItem("enrollments")) || [],
    data1: [], // dpp
    data1_last_fetched_data: null,
    data2: [], // cordova
    data2_last_fetched_data: null,

    // recent fetch logs
    logs_api: JSON.parse(localStorage.getItem("logs_api")) || [],
    data1_last_error: null,
    data2_last_error: null,
  }),
  actions: {
    // function that calls the get_enrollments, get_data1 and get_data2 functions and then sets an interval to do it again in 1 minute
    async start_fetch_interval() {
      this.get_enrollments();
      await this.get_data1();
      await this.get_data2();
      this.ensure_users_exist();
      this.post_fetch_routine();

      setInterval(async () => {
        this.create_toast({
          // title: "Data Refreshed",
          color: "bg-sky-500",
          loading: true,
          // message: "Your settings have been saved successfully.",
        });
        this.get_enrollments();
        await this.get_data1();
        await this.get_data2();
        this.ensure_users_exist();
        this.post_fetch_routine();
        this.trigger_refresh();
      }, 30000);
    },

    //function that clears last_deal_count for all users
    clear_last_deal_count() {
      console.log("clearing last deal count");
      this.users.forEach((user) => {
        user.last_deal_count = {
          count: 0,
          created_at: new Date(),
        };
      });

      // save to local storage
      localStorage.setItem("users", JSON.stringify(this.users));
    },

    post_fetch_routine() {
      // if there is any use that doesn't have a last_deal_count along with last_deal_count.created_at, last_deal_count.count make sure to set them
      this.users.forEach((user) => {
        if (!user.last_deal_count) {
          user.last_deal_count = {
            count: 0,
            created_at: new Date(),
          };
        }
      });

      // if there is any user that has last_deal_count.created_at is yesterday, clear all with clear_last_deal_count
      const usersWithOldDealCount = this.users.filter((user) =>
        dayjs(user.last_deal_count.created_at).isBefore(dayjs(), "day")
      );

      //ensures consistency across all users
      if (usersWithOldDealCount.length > 0) {
        this.clear_last_deal_count();
      }

      // need to loop over the getter_user_leaderboard and create a boast the pops up for 5 seconds and then disappears and continues to the next user
      const leaderboard = this.getter_user_leaderboard_today_only;

      const image_links = [
        // BEST
        "https://media2.giphy.com/media/EJMyMO22UxP68/200w.gif?cid=6c09b952qt0inbdzliqfc80k2v1gro5i2ds30lprw6dnhfyb&ep=v1_gifs_search&rid=200w.gif&ct=g",
        "https://media.tenor.com/xFkbtaZzX1YAAAAM/bankroll-money.gif",
        "https://media1.giphy.com/media/naigTcLxP5MIkE9rIp/giphy.gif?cid=6c09b952klyg7yj5zwjsg1qkuc4pqx4ryyaihirwq884sbd7&ep=v1_internal_gif_by_id&rid=giphy.gif&ct=g",
        "https://media1.tenor.com/m/Ez15J7SPv-YAAAAC/money-show.gif",
        "https://media3.giphy.com/media/10EjjGI0KGz3xK/200w.gif?cid=6c09b952tostmw2fn4e9gif937idk6exp0oo5eajxlp8daxm&ep=v1_gifs_search&rid=200w.gif&ct=g",
        "https://i.imgur.com/Y96P3fx.gif",
        "https://www.icegif.com/wp-content/uploads/2022/08/icegif-138.gif",
        "https://media.licdn.com/dms/image/D4E12AQFqttZsWKBWyw/article-cover_image-shrink_600_2000/0/1668494208197?e=2147483647&v=beta&t=IiWpCJX74PZXa7GWsJ1QLGv5IK4uL2nwOc99I-V3hBA",
        "https://media.tenor.com/ZPTp3ecUPagAAAAM/crushing-it.gif",
        "https://media.tenor.com/5XKo42Sd_Z8AAAAM/michael-scott-wink.gif",
        "https://media2.giphy.com/media/3HQab3B8RpaTTVcR8k/200w.gif?cid=6c09b9525rq54evroz43r9tw8kji4ik4458cpnzkq5147vht&ep=v1_gifs_search&rid=200w.gif&ct=g",
        "https://media2.giphy.com/media/Qw4X3Fq4mZnlIOkeJ9e/200w.gif?cid=6c09b952700rim4hg1igzv5k9negu7u395xq4kh1fh3u2qki&ep=v1_gifs_search&rid=200w.gif&ct=g",
        "https://media2.giphy.com/media/aoZNck1kze91pNwLex/giphy.gif?cid=6c09b952gvf8z4f13hmkn4zg6bcq94seslkpxjmylwivcvko&ep=v1_internal_gif_by_id&rid=giphy.gif&ct=g",
        "https://media2.giphy.com/media/hRhZ1dzw8gDNCcr36c/200w.gif?cid=6c09b952kbgo7oa1sr5ejade8yeqzq351hy15ljnchdctxuw&ep=v1_gifs_search&rid=200w.gif&ct=g",
        "https://cdn.dribbble.com/users/911625/screenshots/4661928/pig.gif",
        "https://media.tenor.com/fHwB83vq2pcAAAAj/simon-mader-instamon.gif",
        "https://media4.giphy.com/media/Aa5dkyWUr1E6dXQr2O/200w.gif?cid=6c09b952vakn3skyjmdx6qr7hvf9gc8177ivvzlakphyvvxq&ep=v1_videos_search&rid=200w.gif&ct=v",
        "https://media0.giphy.com/media/fUpCyNcxcBHEaW2RKJ/giphy.gif?cid=6c09b952xj2z549otemtkl6ydgi4zah3yg8evqjq2pq1u0j9&ep=v1_internal_gif_by_id&rid=giphy.gif&ct=g",
        "https://cardonesolutions.com/wp-content/uploads/2018/09/GCKarate.gif",
      ];

      leaderboard.forEach((user, index) => {
        let message = `${user.deal_count}`;
        let pic = image_links[Math.floor(Math.random() * image_links.length)];
        if (user.deal_count === 3) {
          message = "Strike!";
        } else if (user.deal_count === 4) {
          message = "Double Strike!";
        } else if (user.deal_count === 5) {
          message = "Turkey!";
        } else if (user.deal_count === 6) {
          message = "Six Pack!";
        } else if (user.deal_count === 7) {
          message = "Seven Bagger!";
        }

        if (user.deal_count >= 3) {
          // set the this.users.last_deal_count to the current user's deal count
          const user_index = this.users.findIndex(
            (u) => u.first_name + " " + u.last_name === user.sales_user
          );

          // check the this.users.last_deal_count and only create a boast if the current user's deal count is greater than the last deal count
          if (
            user_index !== -1 &&
            user?.deal_count > this.users[user_index]?.last_deal_count?.count
          ) {
            setTimeout(() => {
              this.create_boast({
                color: "bg-emerald-500",
                title: `${user.sales_user}`,
                body: `${user.deal_count} Deals!`,
                pic: pic,
                message: message,
              });

              if (user_index !== -1) {
                this.users[user_index].last_deal_count = {
                  count: user.deal_count,
                  created_at: new Date(),
                };
              }
            }, index * 5000);
          }
        }
      });
    },

    // update the this.users.profile_pic_url for a user
    update_user_profile_pic_url() {
      // update the users local storage

      localStorage.setItem("users", JSON.stringify(this.users));
    },

    copy_text(text) {
      navigator.clipboard.writeText(text).then(() => {
        this.create_toast({
          color: "bg-emerald-500",
          title: "Copied to Clipboard",
          message: text,
        });
      });
    },

    // action that ensures that any users that don't exist in the users array are added to it - use the getter_users_select_options getter to get the options
    ensure_users_exist() {
      // Get and store the getter_users_select_options
      const options = this.getter_users_select_options;

      // Filter and return only the users from options that don't exist in the users array
      const filtered = options.filter(
        (option) =>
          !this.users.some(
            (user) => `${user.first_name} ${user.last_name}` === option.value
          )
      );

      // Create new user objects for each filtered option and add them to the users array
      filtered.forEach((option) => {
        if (option.value) {
          const [firstName, lastName] = option.value.split(" ");
          const newUser = {
            first_name: firstName || "", // Fallback to empty string if undefined
            last_name: lastName || "", // Fallback to empty string if undefined
            profile_pic_url: "",
          };
          this.users.push(newUser);
        }
      });

      // Store the updated users array in local storage
      localStorage.setItem("users", JSON.stringify(this.users));
    },

    create_toast(toast) {
      this.toasts.push(toast);

      setTimeout(() => {
        this.toasts.shift();
      }, 3500);
    },

    create_api_log(log) {
      this.logs_api.push(log);
      localStorage.setItem("logs_api", JSON.stringify(this.logs_api));

      // ensure we only store the most recent 50 logs
      if (this.logs_api.length > 25) {
        this.logs_api.shift();
      }

      // log the data1_last_error
      if (log.source === "DPP" && log.type === "error") {
        this.data1_last_error = log;
      }

      // log the data2_last_error
      if (log.source === "CORDOVA" && log.type === "error") {
        this.data2_last_error = log;
      }
    },

    delete_toast(index) {
      this.toasts.splice(index, 1);
    },

    create_boast(boast) {
      this.boasts.push(boast);

      setTimeout(() => {
        this.boasts.shift();
      }, 4480);
    },

    delete_boast(index) {
      this.boasts.splice(index, 1);
    },

    // loading spinner that loads for 2 seconds before hiding
    trigger_refresh() {
      this.refreshing = true;
      setTimeout(() => {
        this.refreshing = false;
      }, 800);
    },

    save_settings() {
      localStorage.setItem("settings", JSON.stringify(this.settings));
      this.trigger_refresh();
      this.create_toast({
        title: "Settings Saved",
        color: "bg-emerald-500",
        // message: "Your settings have been saved successfully.",
      });
    },

    reset_settings() {
      this.settings = {
        debt_goal: 500000,
      };
      localStorage.removeItem("settings");
    },

    get_accounting_format(number) {
      const wholeNumber = Math.floor(number); // Or use Math.ceil() or Math.round() as needed
      return new Intl.NumberFormat("en-US").format(wholeNumber);
    },

    // used on all date fields to format the date to a consistent format - used on enrollment_date
    get_reformatted_date(date) {
      if (!date) {
        console.error("Invalid date provided:", date);
        return null; // Return null or an appropriate fallback for invalid input
      }
      const newDate = dayjs(date).format("YYYY/MM/DD");

      return newDate;
    },

    // get reformatted date - same as above but with time also
    get_reformatted_date_time(date) {
      if (!date) {
        console.error("Invalid date provided:", date);
        return null; // Return null or an appropriate fallback for invalid input
      }
      const newDate = dayjs(date).format("YYYY/MM/DD hh:mm:ss A");

      return newDate;
    },

    get_enrollments() {
      // const test_enrollments = [
      //   {
      //     sales_user: "Local Test",
      //     debt_amount: 1,
      //     enrollment_date: "11-27-2024",
      //     type: "local",
      //   },
      //   {
      //     sales_user: "Local Test",
      //     debt_amount: 1,
      //     enrollment_date: "11-27-2024",
      //     type: "local",
      //   },
      //   {
      //     sales_user: "Local Test2",
      //     debt_amount: 1,
      //     enrollment_date: "11-27-2024",
      //     type: "local",
      //   },
      // ];

      // ensure this.enrollments all have the type local
      this.enrollments.forEach((enrollment) => {
        enrollment.type = "local"; // type flag
        enrollment.debt_amount = parseInt(enrollment.debt_amount); // convert debt_amount to integer for maths
        enrollment.enrollment_date = this.get_reformatted_date(
          // reformat date for dayjs compatibility
          enrollment.enrollment_date
        );
      });

      if (this.test_mode) {
        // merge test data with local storage data into one array
        const test_and_local_enrollments = [
          // ...test_enrollments,
          ...this.enrollments,
        ];

        this.enrollments = test_and_local_enrollments;

        return this.enrollments;
      } else {
        return this.enrollments;
      }
    },

    async get_data1() {
      try {
        const test_data1 = [
          {
            sales_user: "DPP User1",
            debt_amount: 1,
            enrollment_date: "11-27-2024",
            type: "data1",
          },
          {
            sales_user: "DPP User1",
            debt_amount: 1,
            enrollment_date: "11-27-2024",
            type: "data1",
          },
          {
            sales_user: "DPP User2",
            debt_amount: 1,
            enrollment_date: "11-27-2024",
            type: "data1",
          },
          {
            sales_user: "DPP User3",
            debt_amount: 1,
            enrollment_date: "11-27-2024",
            type: "data1",
          },
        ];

        if (this.test_mode) {
          this.data1 = test_data1;
          return this.data1;
        } else {
          const { data } = await axios.get("https://api.example.com/data1");

          if (data) {
            this.create_api_log({
              type: "success",
              source: "DPP",
              message: "Returned Data Successfully",
              created_at: new Date(),
            });
          }

          data.forEach((item) => {
            item.type = "data1"; // type flag
            item.debt_amount = parseInt(item.debt_amount); // convert debt_amount to integer for maths
            item.enrollment_date = this.get_reformatted_date(
              // reformat date for dayjs compatibility
              item.enrollment_date
            );
          });

          this.data1_last_fetched_data = this.data1; // storing the last fetched data1

          this.data1 = data;

          return this.data1;
        }
      } catch (error) {
        //log the error in this.log_api
        this.create_api_log({
          type: "error",
          source: "DPP",
          message: "Failed to Return Data",
          created_at: new Date(),
        });

        //locally store the log_api array
        localStorage.setItem("logs_api", JSON.stringify(this.logs_api));

        console.log("Error fetching data1", error);
      }
    },
    // CORDOVA
    async get_data2() {
      try {
        const test_data2 = [
          {
            sales_user: "Cordova User1",
            debt_amount: 1,
            enrollment_date: "11-27-2024",
            type: "data2",
          },
          {
            sales_user: "Cordova User1",
            debt_amount: 1,
            enrollment_date: "11-27-2024",
            type: "data2",
          },
          {
            sales_user: "Cordova User2",
            debt_amount: 1,
            enrollment_date: "11-27-2024",
            type: "data2",
          },
          {
            sales_user: "Cordova User3",
            debt_amount: 1,
            enrollment_date: "11-27-2024",
            type: "data2",
          },
        ];

        if (this.test_mode) {
          this.data2 = test_data2;
          return this.data2;
        } else {
          const { data } = await axios.get("https://api.example.com/data2");

          if (data) {
            this.create_api_log({
              type: "success",
              source: "CORDOVA",
              message: "Returned Data Successfully",
              created_at: new Date(),
            });
          }

          data.forEach((item) => {
            item.type = "data2"; // type flag
            item.debt_amount = parseInt(item.debt_amount); // convert debt_amount to integer for maths
            item.enrollment_date = this.get_reformatted_date(
              // reformat date for dayjs compatibility
              item.enrollment_date
            );
          });

          this.data2_last_fetched_data = this.data2; // storing the last fetched data2

          this.data2 = data;

          return this.data2;
        }
      } catch (error) {
        //log the error in this.log_api
        this.create_api_log({
          type: "error",
          source: "CORDOVA",
          message: "Failed to Return Data",
          created_at: new Date(),
        });

        //locally store the log_api array
        localStorage.setItem("logs_api", JSON.stringify(this.logs_api));

        console.log("Error fetching data2", error);
      }
    },

    // local storage methods
    set_local_storage({ item, value }) {
      this[item] = value;
      localStorage.setItem(item, value);
    },

    delete_local_storage(item) {
      this[item] = null;
      localStorage.removeItem(item);
    },

    get_local_storage(item) {
      return JSON.parse(localStorage.getItem(item));
    },

    // toggle modals
    show_modal(show_var) {
      this[show_var] = true;
    },

    hide_modal(hide_var) {
      this[hide_var] = false;
    },

    // create methods
    create_user(user) {
      console.log("creating user", user);
      this.users.push(user);
      localStorage.setItem("users", JSON.stringify(this.users));

      this.create_toast({
        title: "User Saved",
        color: "bg-emerald-500",
        // message: "Your settings have been saved successfully.",
      });
    },

    delete_user(index) {
      this.users.splice(index, 1);
      localStorage.setItem("users", JSON.stringify(this.users));
      this.trigger_refresh();
      this.create_toast({
        title: "User Deleted",
        color: "bg-red-500",
        // message: "Your settings have been saved successfully.",
      });
    },

    create_enrollment(enrollment) {
      this.enrollments.push(enrollment);
      localStorage.setItem("enrollments", JSON.stringify(this.enrollments));
      this.trigger_refresh();
      this.create_toast({
        title: "Enrollment Saved",
        color: "bg-emerald-500",
        // message: "Your settings have been saved successfully.",
      });
    },

    delete_enrollment(index) {
      this.enrollments.splice(index, 1);
      localStorage.setItem("enrollments", JSON.stringify(this.enrollments));
      this.trigger_refresh();
      this.create_toast({
        title: "Enrollment Deleted",
        color: "bg-red-500",
        // message: "Your settings have been saved successfully.",
      });
    },

    create_spiff(spiff) {
      this.spiffs.push(spiff);
      localStorage.setItem("spiffs", JSON.stringify(this.spiffs));
    },

    delete_spiff(index) {
      this.spiffs.splice(index, 1);
      localStorage.setItem("spiffs", JSON.stringify(this.spiffs));
    },
  },
  getters: {
    // returns the start date based on the selected range of time_range_period
    getter_start_date: (state) => {
      const now = dayjs();
      if (state.time_range_period === "today") {
        return now.format("YYYY/MM/DD");
      } else if (state.time_range_period === "week") {
        // Adjust to get the Monday of the current week
        return now.startOf("week").add(1, "day").format("YYYY/MM/DD"); // Add 1 day to make Monday the start
      } else if (state.time_range_period === "month") {
        return now.startOf("month").format("YYYY/MM/DD");
      }
    },
    // returns the end date based on the selected range of time_range_period
    getter_end_date: (state) => {
      const now = dayjs();
      if (state.time_range_period === "today") {
        return now.format("YYYY/MM/DD");
      } else if (state.time_range_period === "week") {
        // Adjust to get the Sunday of the current week
        return now.endOf("week").format("YYYY/MM/DD"); // Sunday is already the end of the week
      } else if (state.time_range_period === "month") {
        return now.endOf("month").format("YYYY/MM/DD");
      }
    },

    // TODO - mock data - need to replace with actual data
    getter_final_combined_data: (state) => {
      // Extract data from the state, if empty set an empty array
      const enrollments = state.enrollments || [];
      const data1 = state.data1 || [];
      const data2 = state.data2 || [];

      // Combine data only if they have any length
      const combinedData = [];
      if (enrollments.length) combinedData.push(...enrollments);
      if (data1.length) combinedData.push(...data1);
      if (data2.length) combinedData.push(...data2);

      // reformat date for dayjs compatibility
      combinedData.forEach((item) => {
        item.enrollment_date = state.get_reformatted_date(item.enrollment_date);
      });

      return combinedData;
    },

    getter_spiffs: (state) => {
      return state.spiffs;
    },

    // select options for the users select dropdown
    getter_users_select_options: (state) => {
      // Extract unique sales users from the this.users array
      const uniqueUsers = Array.from(
        new Set(
          state.users.map((user) => user.first_name + " " + user.last_name)
        )
      );

      // Extract unique sales users from the getter_final_combined_data getter
      const finalData = state.getter_final_combined_data;
      const uniqueSalesUsers = Array.from(
        new Set(finalData.map((data) => data.sales_user))
      );

      // Combine the two arrays, remove duplicates, and filter out falsy values
      const combinedUsers = Array.from(
        new Set([...uniqueUsers, ...uniqueSalesUsers].filter(Boolean))
      );

      // Map combined users to select options
      const options = combinedUsers.map((user) => ({
        value: user,
        label: user,
      }));

      // Add a default "Select a user" option at the beginning
      options.unshift({ value: "", label: "Select a user" });

      return options;
    },

    getter_company_debt_total: (state) => {
      const start_date = state.get_reformatted_date(state.getter_start_date);
      const end_date = state.get_reformatted_date(state.getter_end_date);

      // Filter enrollments by date range using the computed start_date and end_date
      const allCombinedEnrollments = state.getter_final_combined_data.filter(
        (enrollment) => {
          const date = dayjs(enrollment.enrollment_date);
          return date.isBetween(start_date, end_date, null, "[]");
        }
      );

      // sum all debts in the combined enrollments
      const sum = allCombinedEnrollments.reduce(
        (acc, enrollment) => acc + enrollment.debt_amount,
        0
      );

      return sum;
    },

    getter_company_enrollments_count_today: (state) => {
      // Filter enrollments by today's date
      const today = dayjs().format("YYYY/MM/DD");
      const enrollmentsToday = state.getter_final_combined_data.filter(
        (enrollment) => enrollment.enrollment_date === today
      )?.length;

      //return the count of the enrollments

      return enrollmentsToday;
    },

    getter_company_enrolled_debt_today: (state) => {
      // Filter enrollments by today's date
      const today = dayjs().format("YYYY/MM/DD");
      const enrollmentsToday = state.getter_final_combined_data.filter(
        (enrollment) => enrollment.enrollment_date === today
      );

      // sum all debts in the combined enrollments
      const sum = enrollmentsToday.reduce(
        (acc, enrollment) => acc + enrollment.debt_amount,
        0
      );

      return sum;
    },

    getter_company_average_debt: (state) => {
      const start_date = state.get_reformatted_date(state.getter_start_date);
      const end_date = state.get_reformatted_date(state.getter_end_date);

      // Filter enrollments by date range using the computed start_date and end_date
      const allCombinedEnrollments = state.getter_final_combined_data.filter(
        (enrollment) => {
          const date = dayjs(enrollment.enrollment_date);
          return date.isBetween(start_date, end_date, null, "[]");
        }
      );

      // sum all debts in the combined enrollments
      const sum = allCombinedEnrollments.reduce(
        (acc, enrollment) => acc + enrollment.debt_amount,
        0
      );

      // return the average debt
      return Math.floor(sum / allCombinedEnrollments.length);
    },

    getter_company_clients_enrolled: (state) => {
      const start_date = state.get_reformatted_date(state.getter_start_date);
      const end_date = state.get_reformatted_date(state.getter_end_date);

      // Filter enrollments by date range using the computed start_date and end_date
      const allCombinedEnrollments = state.getter_final_combined_data.filter(
        (enrollment) => {
          const date = dayjs(enrollment.enrollment_date);
          return date.isBetween(start_date, end_date, null, "[]");
        }
      );

      // return the count of the enrollments
      return allCombinedEnrollments.length;
    },

    getter_user_leaderboard: (state) => {
      const start_date = state.get_reformatted_date(state.getter_start_date);
      const end_date = state.get_reformatted_date(state.getter_end_date);

      // Filter enrollments by date range using the computed start_date and end_date
      const allCombinedEnrollments = state.getter_final_combined_data.filter(
        (enrollment) => {
          const date = dayjs(enrollment.enrollment_date);
          return date.isBetween(start_date, end_date, null, "[]");
        }
      );

      // Group the combined data by sales_user
      const groupedData = allCombinedEnrollments.reduce((acc, enrollment) => {
        if (!acc[enrollment.sales_user]) {
          acc[enrollment.sales_user] = 0;
        }
        acc[enrollment.sales_user] += enrollment.debt_amount;
        return acc;
      }, {});

      // each groupedData object needs to have the sales rep's total deal count
      const groupedDataWithDealCount = allCombinedEnrollments.reduce(
        (acc, enrollment) => {
          if (!acc[enrollment.sales_user]) {
            acc[enrollment.sales_user] = 0;
          }
          acc[enrollment.sales_user]++;
          return acc;
        },
        {}
      );

      // Create an array of objects from the grouped data
      const leaderboard = Object.entries(groupedData).map(
        ([sales_user, debt_amount]) => ({
          sales_user,
          debt_amount,
          deal_count: groupedDataWithDealCount[sales_user],
        })
      );

      // Sort the leaderboard by debt_amount in descending order
      leaderboard.sort((a, b) => b.deal_count - a.deal_count);

      return leaderboard;
    },

    getter_user_leaderboard_today_only: (state) => {
      const start_date = state.get_reformatted_date(dayjs());
      const end_date = state.get_reformatted_date(dayjs());

      // Filter enrollments by date range using the computed start_date and end_date
      const allCombinedEnrollments = state.getter_final_combined_data.filter(
        (enrollment) => {
          const date = dayjs(enrollment.enrollment_date);
          return date.isBetween(start_date, end_date, null, "[]");
        }
      );

      // Group the combined data by sales_user
      const groupedData = allCombinedEnrollments.reduce((acc, enrollment) => {
        if (!acc[enrollment.sales_user]) {
          acc[enrollment.sales_user] = 0;
        }
        acc[enrollment.sales_user] += enrollment.debt_amount;
        return acc;
      }, {});

      // each groupedData object needs to have the sales rep's total deal count
      const groupedDataWithDealCount = allCombinedEnrollments.reduce(
        (acc, enrollment) => {
          if (!acc[enrollment.sales_user]) {
            acc[enrollment.sales_user] = 0;
          }
          acc[enrollment.sales_user]++;
          return acc;
        },
        {}
      );

      // Create an array of objects from the grouped data
      const leaderboard = Object.entries(groupedData).map(
        ([sales_user, debt_amount]) => ({
          sales_user,
          debt_amount,
          deal_count: groupedDataWithDealCount[sales_user],
        })
      );

      // Sort the leaderboard by debt_amount in descending order
      leaderboard.sort((a, b) => b.deal_count - a.deal_count);

      return leaderboard;
    },

    getter_logs_api: (state) => {
      // return sorted logs_api array by created_at date
      const sorted = state.logs_api.sort((a, b) => b.created_at - a.created_at);

      // return a new array of objects with the created_at date formatted
      const formatted = sorted.map((log) => ({
        ...log,
        created_at: state.get_reformatted_date_time(log.created_at),
      }));

      return formatted;
    },
  },
});
