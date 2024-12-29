<script setup>
import { ref, computed, reactive, watch, Teleport, onMounted } from "vue";
import axios from "axios";
import { csvParse } from "d3-dsv";
import Chart from "./Chart.vue";

/*
EXAMPLE OF EXPECTED DATA - FORMATS OF THE FETCHED DATA NEED TO BE STRUCTURED LIKE THIS:

{

        "Customer Name": "Mark Sloan",

        "Sales User": "Milo New",

        "Enrolled Date": "2024-09-09",

        "Debt Amount": 20524

    }
*/

//url to get the most recent data from

const url = `https://pbx4199.dialninja.com/dash/?api_key=`;
const apiKey = "dbb95f8f-da53-418c-bb41-ee0611539cb3";

const mostUpdatedData = ref([]);

const showSidebarModal = ref(false);
const showUploadModal = ref(false);

const showUsersSidebarModal = ref(false);
const showEnrollmentsSidebarModal = ref(false);

const toggleUsersSidebarModal = () => {
  showUsersSidebarModal.value = !showUsersSidebarModal.value;
};

const toggleEnrollmentsSidebarModal = () => {
  showEnrollmentsSidebarModal.value = !showEnrollmentsSidebarModal.value;
};

const fileInput = ref(null); // the file object
const fileName = ref(""); // the name of the csv file
const columns = ref([]); //the columns in the csv file
const data = ref([]); //the data from the csv file - array of objects
const today = ref("");
const start = ref("");
const end = ref(""); //
const totalDebtWeek = ref([]); // Total debt for the last 7 days
const spiffWeekHovered = ref(false); // Hover state for showing delete button
const spiffTodayHovered = ref(false); // Hover state for showing delete button
const debt_goal = ref(JSON.parse(localStorage.getItem("debtGoal")) || 200000); // Goal for the week
const refreshData = ref(false);
const timeRangePeriod = ref("month"); // default was week - will need to test to ensure month works as expected
const interval_is_running = ref(false);

// toggles the user image url column
const showUrlInput = ref(false);

//toggled left column view
const leftColumnView = ref("both"); // bars, table, or both

const enabledBlocks = ref([
  "enrolled_debt_today",
  "enrolled_today",
  "debt_goal",
  "enrolled_debt_week",
  "enrolled_week",
  "average_",
]);

// function that uses axios get request to get the data from the url
const getData = async () => {
  today.value = getTodaysDate();

  console.log("LAST DATE CHECKED: ", today.value);

  try {
    const response = await axios.get(`${url}${apiKey}`);

    mostUpdatedData.value = response.data;

    //TODO the local storage records will be joined with the most updated data so it can be displayed

    console.table(mostUpdatedData.value);

    data.value = mostUpdatedData.value;

    sumDebtsBetweenStartAndEndDates();

    resetData(data.value);

    showUploadModal.value = false;
  } catch (error) {
    console.error(error);
  }
};

let theInterval = null;

const updateData = async (toggleInterval) => {
  if (toggleInterval) {
    interval_is_running.value = true;
    await getData(); // Run getData immediately

    theInterval = setInterval(() => {
      getData(); //get the data on an interval
    }, 300000); // 5 minutes in milliseconds
    // console.log("Interval Started");
  } else {
    interval_is_running.value = false;

    if (theInterval) {
      // Check if the interval is running
      clearInterval(theInterval); // Clear the interval
      theInterval = null; // Reset the interval variable to avoid clearing it again
      console.log("Interval Stopped");
    }
  }
};

//returns the startDate of the week based on the current day - will always be monday
const startDate = computed(() => {
  const today = new Date();

  if (timeRangePeriod.value === "week") {
    const dayOfWeek = today.getDay();
    const diffToMonday = dayOfWeek === 0 ? -6 : 1 - dayOfWeek; // Adjust if today is Sunday
    const start = new Date(
      today.getFullYear(),
      today.getMonth(),
      today.getDate() + diffToMonday
    );
    return `${start.getMonth() + 1}/${start.getDate()}/${start.getFullYear()}`;
  } else if (timeRangePeriod.value === "month") {
    const start = new Date(today.getFullYear(), today.getMonth(), 1);
    return `${start.getMonth() + 1}/${start.getDate()}/${start.getFullYear()}`;
  } else {
    return "Invalid time range period";
  }
});

//retuns the endDate of the week based on the current day - will always be sunday - debt settlment has weekend sales
const endDate = computed(() => {
  const today = new Date();

  if (timeRangePeriod.value === "week") {
    const dayOfWeek = today.getDay();
    const diffToFriday = 7 - dayOfWeek;
    const end = new Date(
      today.getFullYear(),
      today.getMonth(),
      today.getDate() + diffToFriday
    );
    return `${end.getMonth() + 1}/${end.getDate()}/${end.getFullYear()}`;
  } else if (timeRangePeriod.value === "month") {
    const end = new Date(today.getFullYear(), today.getMonth() + 1, 0); // Last day of the current month
    return `${end.getMonth() + 1}/${end.getDate()}/${end.getFullYear()}`;
  } else {
    return "Invalid time range period";
  }
});

// axios post

//computed function that looks into the data array and returns a new array of unique sales reps in the order of their Debt Amount sum greatest to least
const salesReps = computed(() => {
  return [...new Set(data.value.map((item) => item["Sales User"]))].sort(
    (a, b) => {
      const aDebt = data.value
        .filter((item) => item["Sales User"] === a)
        .reduce((acc, item) => {
          const amount = parseFloat(item["Debt Amount"].replace(/[\$,]/g, ""));
          return acc + amount;
        }, 0);

      const bDebt = data.value
        .filter((item) => item["Sales User"] === b)
        .reduce((acc, item) => {
          const amount = parseFloat(item["Debt Amount"].replace(/[\$,]/g, ""));
          return acc + amount;
        }, 0);

      return bDebt - aDebt;
    }
  );
});

//computed function that looks into the data array and returns a new array of objects where each object belongs to a user and contains a property called sales_rep which holds their name, then the sum of the "Debt Amount" can be put into debt_load_total property, and then a 3rd property called deal_count which contains the count of objects that belong to that Sales User
const salesUsers = computed(() => {
  return salesReps.value
    .map((rep) => {
      return {
        sales_rep: rep,
        debt_load_total: data.value
          .filter((item) => item["Sales User"] === rep)
          .reduce((acc, item) => {
            const amount = parseFloat(
              item["Debt Amount"].replace(/[\$,]/g, "")
            );
            return acc + amount;
          }, 0)
          .toFixed(2),
        deal_count: data.value.filter((item) => item["Sales User"] === rep)
          .length,
      };
    })
    .sort(
      //sort by highest to lowest debt load
      (a, b) => b.debt_load_total - a.debt_load_total
    );
});

//computed function that returns an object with 3 different arrays - the first is the sales_rep array, the second is the debt_load_total array, and the third is the deal_count array
const salesUsersData = computed(() => {
  return {
    sales_rep: salesUsers.value.map((item) => item.sales_rep),
    debt_load_total: salesUsers.value.map((item) => item.debt_load_total),
    deal_count: salesUsers.value.map((item) => item.deal_count),
  };
});

//computed function that uses the salesReps array return a new array of numbers where each number is the sum of the "Debt Amount" between the startDate and endDate for each sales rep and in the same order as the salesReps array
const salesRepsDebt = computed(() => {
  const target = salesReps.value.map((rep) => {
    return data.value
      .filter((item) => item["Sales User"] === rep)
      .reduce((acc, item) => {
        const enrolledDate = new Date(item["Enrolled Date"]);
        if (
          enrolledDate >= new Date(startDate.value) &&
          enrolledDate <= new Date(endDate.value)
        ) {
          const amount = parseFloat(item["Debt Amount"].replace(/[\$,]/g, ""));
          return acc + amount;
        }
        return acc;
      }, 0)
      .toFixed(2);
  });

  return target;
});

//watching data to auto toggle the upload modal
watch(data, (newVal) => {
  if (data.value.length > 0) {
    // showUploadModal.value = false;
    refreshData.value = true;
  } else {
    // showUploadModal.value = true;
    refreshData.value = false;
  }
});

//toggle upload modal
const toggleUploadModal = () => {
  showUploadModal.value = !showUploadModal.value;
};

//toggle sidebar modal
const toggleSidebarModal = () => {
  showSidebarModal.value = !showSidebarModal.value;
};

const resettingData = ref(false);

const resetData = (newData) => {
  if (!newData) {
    let tmp_data = [];
    let tmp_fileName = "";

    tmp_data = data.value;
    tmp_fileName = fileName.value;

    data.value = [];

    resettingData.value = true;
    //remove the local records from temp_data
    tmp_data = tmp_data.filter((deal) => !deal.local);

    fileName.value = "";

    setTimeout(() => {
      data.value = tmp_data;

      //remerge the enrollments with the data array
      data.value = data.value.concat(enrollments.value);

      sumDebtsBetweenStartAndEndDates();

      tmp_data = [];
      fileName.value = tmp_fileName;
      resettingData.value = false;
    }, 1000);
  } else {
    data.value = [];
    resettingData.value = true;

    setTimeout(() => {
      data.value = newData;
      resettingData.value = false;
    }, 1000);
  }
};

//chart options for goal chart
const goalChartOptions = reactive({
  maintainAspectRatio: false,
  //turn off labels
  labels: {
    display: false,
  },

  plugins: {
    legend: {
      display: false, // Disables the legend
    },

    annotation: {
      annotations: {
        line1: {
          type: "line",
          xMin: () => debt_goal.value,
          xMax: () => debt_goal.value,
          borderColor: "white",
          borderWidth: 2,
          borderDash: [10, 5],
        },
        label1: {
          type: "label",
          xMin: () => debt_goal.value,
          xMax: () => debt_goal.value,
          color: "white",
          borderRadius: 5,
          backgroundColor: "rgba(65, 196, 122)",
          content: () =>
            `GOAL: $${formatWholeNumberWithCommas(debt_goal.value)}`,
          font: {
            size: 18,
          },
          xAdjust: -65, // Adjust this value to offset the label to the left
        },
      },
    },
  },
  indexAxis: "y", // Makes the bar chart horizontal
  scales: {
    x: {
      ticks: {
        font: {
          size: 16, // Change this value to adjust the font size
        },
        color: "white", // Change this value to adjust the font color
      },
    },
    y: {
      ticks: {
        font: {
          size: 16, // Change this value to adjust the font size
        },
        color: "white", // Change this value to adjust the font color
      },
    },
  },
});

//chart data for goal chart
const goalChartData = reactive({
  labels: ["Debt Total"],

  datasets: [
    {
      //disable the labels
      data: totalDebtWeek,
      backgroundColor: "rgba(39, 213, 245, 0.22)",
      borderColor: "rgba(39, 213, 245, 1)",
      borderWidth: 1,
      // Set the bar thickness here
      barThickness: 75, // This sets the height of each horizontal bar
    },
  ],
});

//dynamic color function for the goal chart
const determineColor = (debtLoad) => {
  if (debtLoad < 75000) return "red";
  else if (debtLoad >= 75000 && debtLoad < 100000) return "orange";
  else if (debtLoad >= 100000 && debtLoad < 125000) return "red";
  else if (debtLoad >= 125000 && debtLoad < 150000) return "brown";
  else if (debtLoad >= 150000 && debtLoad < 175000) return "orange";
  else if (debtLoad >= 175000 && debtLoad < 200000) return "yellow";
  else if (debtLoad >= 200000 && debtLoad < 225000) return "purple";
  else if (debtLoad >= 225000 && debtLoad < 250000) return "blue";
  else if (debtLoad >= 250000) return "green";
};

//chart options for user chart
const userChartOptions = reactive({
  indexAxis: "y",
  scales: {
    x: {
      beginAtZero: true,
      title: {
        display: false,
        text: "Debt Load and Sales Revenue",
      },
      ticks: {
        font: {
          size: 16,
        },
        color: "white",
      },
    },
    y: {
      title: {
        display: false,
        text: "Sales Rep",
      },
      ticks: {
        font: {
          size: 16,
        },
        color: "white",
      },
    },
  },
  plugins: {
    legend: {
      display: true, // Enable the legend to differentiate the datasets
      labels: {
        font: {
          size: 16,
        },
        color: "rgb(14, 195, 227)",
      },
    },
    tooltip: {
      enabled: true,
    },
  },
  responsive: true,
  maintainAspectRatio: false,
  barThickness: 50,
  maxBarThickness: 50,
});

//chart data for user chart
const userChartData = reactive({
  labels: salesReps,
  datasets: [
    {
      label: "Debt Load",
      backgroundColor: "rgba(39, 114, 245, 0.25)",
      borderColor: "rgba(39, 114, 245, 1)",
      borderWidth: 1,
      data: salesRepsDebt, // Example debt load values for each sales rep
    },

    // {
    //   label: "Deal Count", // The new data point
    //   backgroundColor: "rgba(245, 127, 39, 0.25)",
    //   borderColor: "rgba(245, 127, 39, 1)",
    //   borderWidth: 1,
    //   data: salesUsersData.value.deal_count, // Example deal count values for each sales rep
    // },
  ],
});

const triggerFileInput = () => {
  fileInput.value.click(); // Trigger the hidden file input click event
};

//handles the files to upload and add data to the data array
const handleFiles = (event) => {
  const files = event.target.files || event.dataTransfer.files;
  if (files.length === 0) {
    console.log("No file selected.");
    return;
  }

  const file = files[0]; // If supporting multiple files, you'd loop here
  const reader = new FileReader();

  reader.onload = (e) => {
    const csvText = e.target.result;
    // Parse CSV text into JSON
    fileName.value = file.name;
    const jsonData = csvParse(csvText);

    console.log("JSON Data:", jsonData);
    data.value = trimPropertyNames(jsonData);

    // delete any records from the data array that are local
    data.value = data.value.filter((deal) => !deal.local);

    // need to join the local storage 'enrollments' with 'data' to display the data - enrollments needs to come from localStorage.getItem('enrollments')
    data.value = data.value.concat(enrollments.value);

    sumDebtsBetweenStartAndEndDates();

    resetData();

    columns.value = jsonData.columns;
    showUploadModal.value = false;
  };

  reader.onerror = (e) => console.error("Error reading file:", e.target.error);

  reader.readAsText(file); // Read the file as text for parsing
};

//handles the file drop
const handleDrop = (event) => {
  event.preventDefault(); // Prevent default behavior for drag and drop
  handleFiles(event);
};

//wipes the csv data
const wipeData = () => {
  const confirmWipe = confirm(
    "Are you sure you want to wipe all the CSV data?"
  );

  if (!confirmWipe) {
    return;
  }

  data.value = [];
  fileName.value = "";
};

//computed function to return todays date in the format the csv file uses
const getTodaysDate = () => {
  const today = new Date();
  const month = today.getMonth() + 1; // January is 0!
  const day = today.getDate();
  const year = today.getFullYear();

  const finalDateFormat = `${month}/${day}/${year}`;

  return finalDateFormat;
};

//cleans the csv headers and trims the whitespace on keys
const trimPropertyNames = (arr) => {
  return arr.map((obj) => {
    const newObj = {};

    Object.entries(obj).forEach(([key, value]) => {
      const trimmedKey = key.trim();
      newObj[trimmedKey] = value;
    });

    return newObj;
  });
};

//computed function that returns the sum of "Debt Amount" for todaysDate
const sumDebtsOnDate = (date) => {
  return `$${formatWholeNumberWithCommas(
    data.value
      .filter((item) => item["Enrolled Date"] === date)
      .map(
        (item) => parseFloat(item["Debt Amount"].replace(/[\$,]/g, "")) // Remove $ and , then parse to float
      )
      .reduce((acc, currentValue) => acc + currentValue, 0)
  )}`; // Sum up the values
};

//gets the sum of debt amounts between the startDate (monday) and endDate (friday)
const sumDebtsBetweenStartAndEndDates = () => {
  const start = new Date(startDate.value);
  const end = new Date(endDate.value);

  const sumOfDebtsForWeek = data.value
    .reduce((acc, item) => {
      const enrolledDate = new Date(item["Enrolled Date"]);
      if (enrolledDate >= start && enrolledDate <= end) {
        // Convert the "Debt Amount" to a number and add it to the accumulator
        const amount = parseFloat(item["Debt Amount"].replace(/[\$,]/g, ""));
        return acc + amount;
      }
      return acc;
    }, 0)
    .toFixed(2); // Sum the amounts, then format to 2 decimal places

  // console.log("SUM OF DEBTS FOR WEEK", sumOfDebtsForWeek);

  // get for the week from enrollments
  const sumOfDebtsForWeekFromEnrollments = enrollments.value
    .reduce((acc, item) => {
      const enrolledDate = new Date(item["Enrollment Date"]);
      if (enrolledDate >= start && enrolledDate <= end) {
        // Convert the "Debt Amount" to a number and add it to the accumulator
        const amount = parseFloat(item["Debt Amount"].replace(/[\$,]/g, ""));
        return acc + amount;
      }
      return acc;
    }, 0)
    .toFixed(2); // Sum the amounts, then format to 2 decimal places

  totalDebtWeek.value = [
    parseFloat(sumOfDebtsForWeek) +
      parseFloat(sumOfDebtsForWeekFromEnrollments),
  ];
};

//computed function that gets average "Debt Amount" for clients enrolled between startDate and endDate
const averageDebtAmount = computed(() => {
  const start = new Date(startDate.value);
  const end = new Date(endDate.value);

  const filteredItems = data.value.filter((item) => {
    const enrolledDate = new Date(item["Enrolled Date"]);
    return enrolledDate >= start && enrolledDate <= end;
  });

  const totalDebt = filteredItems.reduce((acc, item) => {
    // Remove $ and commas, then convert to number
    const amount = parseFloat(item["Debt Amount"].replace(/[\$,]/g, ""));
    return acc + amount;
  }, 0);

  const average =
    filteredItems.length > 0 ? totalDebt / filteredItems.length : 0;
  return `$${Intl.NumberFormat("en-US").format(average.toFixed(0))}`; // Convert to 2 decimal places string
});

//gets the total client that enrolled today from the "Enrolled Date" key on the objects in the data array
const clientsEnrolledToday = computed(() => {
  return data.value.filter((item) => item["Enrolled Date"] === today.value)
    .length;
});

//computed function that gets the average program length of all clients
const averageProgramLength = computed(() => {
  const start = new Date(startDate.value);
  const end = new Date(endDate.value);
  return (
    data.value
      .filter((item) => {
        const enrolledDate = new Date(item["Enrolled Date"]);
        return enrolledDate >= start && enrolledDate <= end;
      })
      .map((item) => parseInt(Number(item["Term"])))
      .reduce((acc, currentValue) => acc + currentValue, 0) / data.value.length
  ).toFixed(0);
});

//computd function that returns the total clients enrolled between the startDate and endDate
const clientsEnrolledWeek = computed(() => {
  const start = new Date(startDate.value);
  const end = new Date(endDate.value);

  return data.value.filter((item) => {
    const enrolledDate = new Date(item["Enrolled Date"]);
    return enrolledDate >= start && enrolledDate <= end;
  }).length;
});

//returns an array with 3 objects where the first is 1st place, second is 2nd place, and third is 3rd place - each contain the name and debt load total for the week
const topSalesUsers = computed(() => {
  const userAggregates = data.value.reduce((acc, item) => {
    const user = item["Sales User"];
    const debtAmount = parseFloat(item["Debt Amount"].replace(/[\$,]/g, ""));

    if (!acc[user]) {
      acc[user] = { count: 0, debt_load: 0 };
    }
    acc[user].count += 1;
    acc[user].debt_load += debtAmount;

    return acc;
  }, {});

  const userObjects = Object.entries(userAggregates).map(
    ([sales_user, data]) => ({
      sales_user,
      debt_load: data.debt_load.toFixed(2), // Formatting the debt_load to 2 decimal places
    })
  );

  // Sorting by count, but could also sort by debt_load if that's more relevant
  userObjects.sort((a, b) => b.debt_load - a.debt_load);

  return userObjects.slice(0, 3); // Return the top 3 sales users
});

//spiffsToday array or default to the local storage value
const company_name = ref(
  JSON.parse(localStorage.getItem("companyName")) || "Lend & Loan Financial"
);
//spiffsToday array or default to the local storage value
const spiffsToday = ref(JSON.parse(localStorage.getItem("spiffsToday")) || []);

//spiffsWeek array or default to the local storage value
const spiffsWeek = ref(JSON.parse(localStorage.getItem("spiffsWeek")) || []);

const spiffAdderToday = () => {
  console.log(spiffsToday.value);
  spiffsToday.value.push({
    sales_rep: "",
    spiff_amount: "",
  });
};

const spiffAdderWeek = () => {
  spiffsWeek.value.push({
    sales_rep: "",
    spiff_amount: "",
  });
};

const saveSettings = () => {
  localStorage.setItem("companyName", JSON.stringify(company_name.value));
  localStorage.setItem("debtGoal", JSON.stringify(debt_goal.value));
  resetData();
};

//watch the spiffsToday array and store in local storage
watch(spiffsToday.value, (newVal) => {
  console.log(newVal);
  localStorage.setItem("spiffsToday", JSON.stringify(newVal));
});

//watch the spiffsWeek array and store in local storage
watch(spiffsWeek.value, (newVal) => {
  console.log(newVal);

  localStorage.setItem("spiffsWeek", JSON.stringify(newVal));
});

//function to handle the hover over event for spiff Week - toggle for showing delete button
const spiffWeekHoverOver = () => {
  spiffWeekHovered.value = true;
};

//function to handle the hover leave event for spiff Week - toggle for hiding delete button
const spiffWeekHoverLeave = () => {
  spiffWeekHovered.value = false;
};

//function to handle the hover over event for spiff Today - toggle for showing delete button
const spiffTodayHoverOver = () => {
  spiffTodayHovered.value = true;
};

//function to handle the hover leave even for spiff Today - toggle for hiding delete button
const spiffTodayHoverLeave = () => {
  spiffTodayHovered.value = false;
};
//function to handle the hover over event for spiff Today - toggle for showing delete button
const usersHoverOver = () => {
  spiffTodayHovered.value = true;
};

//function to handle the hover leave even for spiff Today - toggle for hiding delete button
const usersHoverLeave = () => {
  spiffTodayHovered.value = false;
};

//function to return whole number format with commas and no decimal - example: 1,000,000
const formatWholeNumberWithCommas = (number) => {
  const wholeNumber = Math.floor(number); // Or use Math.ceil() or Math.round() as needed
  return new Intl.NumberFormat("en-US").format(wholeNumber);
};

//computed function that returns the new clients today
const newClientsToday = computed(() => {
  const today = new Date();
  const formattedToday = `${
    today.getMonth() + 1
  }/${today.getDate()}/${today.getFullYear()}`;

  return data.value.filter((item) => item["Enrolled Date"] === formattedToday);
});

//wipes all the local storage for client side data
const wipeLocalStorage = () => {
  const confirmWipe = confirm(
    "Are you sure you want to wipe all the local storage data?"
  );

  if (!confirmWipe) {
    return;
  }

  localStorage.clear();

  //reload the page
  location.reload();
};

//onMounted setting a few variables
onMounted(async () => {
  today.value = getTodaysDate();
  start.value = startDate.value;
  end.value = endDate.value;

  console.log(
    "START: ",
    start.value,
    " | TODAY: ",
    today.value,
    " | End: ",
    end.value
  );

  //begin the interval to pull the updated data
  // await updateData();

  // on mounted merge the enrollments with the data array
  data.value = data.value.concat(enrollments.value);

  resetData();
});

//watch the timeRangePeriod and run resetData function
watch(timeRangePeriod, () => {
  sumDebtsBetweenStartAndEndDates();
  resetData();
});

// computed that returns the current month's name

const currentMonth = computed(() => {
  const today = new Date();
  const month = today.toLocaleString("default", { month: "long" });
  return month;
});

const showManageManualRecords = ref(false);

const toggleManageManualRecords = () => {
  showManageManualRecords.value = !showManageManualRecords.value;
};

const users = ref(JSON.parse(localStorage.getItem("users")) || []);

const addUser = () => {
  users.value.push({
    profile_pic_url: "",
    first_name: "",
    last_name: "",
  });
};

//watch users array and store in local storage
watch(users.value, (newVal) => {
  console.log(newVal);

  localStorage.setItem("users", JSON.stringify(newVal));
});

const usersData = computed(() => {
  const uniqueUsers = [
    ...new Set(
      data.value.map((deal) => deal["Sales User"]?.trim().toLowerCase())
    ),
  ].map((sales_user) => {
    return {
      sales_user,
    };
  });

  const addedDebtLoadTotals = uniqueUsers
    .map((user) => {
      const userDeals = data.value.filter(
        (deal) => deal["Sales User"]?.trim().toLowerCase() === user.sales_user
      );

      const debtLoadTotal = userDeals.reduce((acc, deal) => {
        const amount = parseFloat(
          deal["Debt Amount"]?.replace(/[\$,]/g, "") || 0
        );
        return acc + amount;
      }, 0);

      return {
        sales_user: user?.sales_user?.replace(/\b\w/g, (char) =>
          char.toUpperCase()
        ),
        deal_count: userDeals.length,
        debt_load_total: debtLoadTotal,
      };
    })
    .sort((a, b) => {
      if (a.deal_count === b.deal_count) {
        return b.debt_load_total - a.debt_load_total;
      }
      return b.deal_count - a.deal_count;
    });

  return addedDebtLoadTotals;
});

const enrollments = ref(JSON.parse(localStorage.getItem("enrollments")) || []);

const cordovaData = ref([]);

// set placeholder api request to an example url. a get request will be made to this url to get the data
const cordovaUrl = "https://jsonplaceholder.typicode.com/posts";

const getCordovaData = async () => {
  try {
    const response = await axios.get(cordovaUrl);

    console.log("CORDOVA DATA - BEFORE ADDING TYPE: ", response.data);

    //response will be an array of objects - loop over them and add a type property and set it to cordova
    response.data.forEach((deal) => {
      deal.type = "cordova";
    });

    console.log("CORDOVA DATA - AFTER ADDING TYPE: ", response.data);

    cordovaData.value = response.data;
  } catch (error) {
    console.error(error);
  }
};

const confirmEnrollmentDelete = (index) => {
  const confirmDelete = confirm(
    "Are you sure you want to delete this enrollment?"
  );

  if (confirmDelete) {
    enrollments.value.splice(index, 1);

    // store the enrollments in local storage
    localStorage.setItem("enrollments", JSON.stringify(enrollments.value));

    // delete 'data' records that are local
    data.value = data.value.filter((deal) => !deal.local);

    // remerge the enrollments with the data array
    data.value = data.value.concat(enrollments.value);

    resetData();
  }
};

const confirmUserDelete = (index) => {
  const confirmDelete = confirm("Are you sure you want to delete this user?");

  if (confirmDelete) {
    users.value.splice(index, 1);
  }
};

// watch(enrollments.value, (oldVal, newVal) => {
//   console.log(newVal);

//   const validEnrollments = newVal.filter(
//     (enrollment) =>
//       enrollment["Debt Amount"] &&
//       enrollment["Sales User"] &&
//       enrollment["Enrollment Date"]
//   );

//   validEnrollments.forEach((enrollment) => {
//     enrollment["Debt Amount"] = `$${formatWholeNumberWithCommas(
//       parseFloat(enrollment["Debt Amount"].replace(/[\$,]/g, ""))
//     )}`;
//   });

//   localStorage.setItem("enrollments", JSON.stringify(validEnrollments));
// });

const userSelectOptions = computed(() => {
  const dataUsers = [
    ...new Set(data.value.map((deal) => deal["Sales User"].trim())),
  ].map((sales_user) => {
    return {
      value: sales_user,
      label: sales_user,
    };
  });

  console.log("DATA USERS: ", dataUsers);

  // get usersUsers from the users array and dedupe them by a concatenated first and last name
  const usersUsers = [
    ...new Set(
      users.value.map(
        (user) => `${user.first_name.trim()} ${user.last_name.trim()}`
      )
    ),
  ].map((user) => {
    return {
      value: user,
      label: user,
    };
  });

  console.log("USERS USERS: ", usersUsers);

  // combine the two arrays and dedupe them
  const combinedUsers = [
    ...new Set([...dataUsers, ...usersUsers].map((user) => user.value)),
  ].map((user) => {
    return {
      value: user,
      label: user,
    };
  });

  console.log("COMBINED USERS: ", combinedUsers);

  return combinedUsers;
});

const creatingEnrollment = ref({
  "Sales User": "",
  "Debt Amount": "",
  "Enrollment Date": new Date().toLocaleDateString(),
  local: true,
});

const createEnrollment = () => {
  if (
    creatingEnrollment.value["Sales User"] === "" ||
    creatingEnrollment.value["Debt Amount"] === "" ||
    creatingEnrollment.value["Enrollment Date"] === ""
  ) {
    alert("Please fill out all fields before adding a new enrollment.");
    return;
  }

  //format the Debt Amount to the correct format
  creatingEnrollment.value["Debt Amount"] = `$${formatWholeNumberWithCommas(
    parseFloat(creatingEnrollment.value["Debt Amount"].replace(/[\$,]/g, ""))
  )}`;

  //format the Enrollment Date to the correct format: '0000-00-00'
  creatingEnrollment.value["Enrollment Date"] = new Date(
    creatingEnrollment.value["Enrollment Date"]
  )
    .toLocaleDateString("en-GB")
    .split("/")
    .reverse()
    .join("-");

  creatingEnrollment.value.local = true;

  // delete any records from the data array that are local
  data.value = data.value.filter((deal) => !deal.local);

  enrollments.value.push(creatingEnrollment.value);

  // store the enrollments in local storage
  localStorage.setItem("enrollments", JSON.stringify(enrollments.value));

  // reset the creatingEnrollment object to default values
  creatingEnrollment.value = {
    "Sales User": "",
    "Debt Amount": "",
    "Enrollment Date": new Date().toLocaleDateString(),
  };

  // remerge the enrollments with the data array
  data.value = data.value.concat(enrollments.value);

  resetData();
};

watch(enrollments.value, (newVal) => {
  sumDebtsBetweenStartAndEndDates();
});

watch(cordovaData.value, (newVal) => {
  sumDebtsBetweenStartAndEndDates();
});
</script>

<template>
  <Teleport to="#modals">
    <transition
      enter-active-class="transition ease-out duration-300"
      enter-from-class="translate-x-full opacity-0"
      enter-to-class="translate-x-0 opacity-100"
      leave-active-class="transition ease-in duration-300"
      leave-from-class="translate-x-0 opacity-100"
      leave-to-class="translate-x-full opacity-0"
    >
      <div
        v-if="showSidebarModal"
        @click.self="toggleSidebarModal"
        class="fixed top-0 left-0 w-screen h-screen backdrop-brightness-50 z-50 max-w-screen max-h-screen flex flex-col items-end"
      >
        <div class="h-full w-1/2 bg-base-100">
          <div class="flex flex-col gap-2 p-5 h-full w-full">
            <div class="flex flex-row gap-5 items-center">
              <h1 class="text-2xl font-bold text-gray-100 text-left">
                <span class="text-white"> Settings </span>
              </h1>

              <div class="flex flex-row items-center gap-2 ml-auto">
                <button
                  class="btn btn-sm bg-red-500 hover:bg-red-600 text-white ml-auto"
                  @click="wipeLocalStorage"
                  title="Wipe All Local Storage Data"
                >
                  Reset To Default
                </button>
                <button
                  class="btn btn-sm bg-emerald-500 hover:bg-emerald-600 text-white"
                  @click="saveSettings"
                  title="Wipe All Local Storage Data"
                >
                  Save Settings
                </button>
              </div>
            </div>

            <div class="flex flex-col gap-5 text-white">
              <div class="grid grid-cols-4 gap-3">
                <div class="col-span-2 flex flex-col gap-3">
                  <label for="company_name">Company Name</label>
                  <input
                    id="company_name"
                    type="text"
                    v-model="company_name"
                    class="input input-sm bg-gray-100 text-slate-600"
                  />
                </div>

                <div class="col-span-2 flex flex-col gap-3">
                  <label for="debt_goal">Debt Goal</label>
                  <input
                    id="debt_goal"
                    type="text"
                    v-model.number="debt_goal"
                    class="input input-sm bg-gray-100 text-slate-600"
                  />
                </div>

                <!-- <div class="col-span-4 flex flex-col gap-3">
                  <div class="flex flex-col gap-3 items-start">
                    
                    <label for="timeRangePeriod">Hide / Show Blocks</label>
                    
                    <div class="flex flex-row gap-3">
                      <input
                        type="checkbox"
                        id="average-program-legnth"
                        v-model="enabledBlocks"
                        value="average_program_length"
                      />
                      <label for="average-program-length"
                        >Average Program Length</label
                      >
                    </div>
                  </div>
                </div> -->
              </div>
            </div>

            <div class="p-2 flex flex-col gap-5 text-white mt-auto">
              <p class="text-base">Support</p>
              <ul class="text-base list-disc list-inside gap-2 space-y-2 pl-5">
                <!-- <li>support@finnypi.com</li> -->
              </ul>
            </div>

            <div class="w-full ml-auto">
              <div class="flex-1 flex flex-row justify-center items-center">
                <div
                  v-if="!fileName"
                  class="p-8 rounded-xl flex flex-col items-center justify-center gap-8 h-full w-full"
                  @dragover.prevent
                  @dragleave.prevent
                  @drop="handleDrop"
                >
                  <p class="text-xl text-center">Drag and Drop CSV File Here</p>

                  <p>OR</p>

                  <button
                    @click="triggerFileInput"
                    class="bg-blue-500 text-gray-100 p-2"
                  >
                    Browse for a CSV File
                  </button>
                  <input
                    type="file"
                    ref="fileInput"
                    class="hidden"
                    accept=".csv"
                    @change="handleFiles"
                    placeholder="Upload File"
                  />
                </div>
              </div>
            </div>

            <div class="flex flex-row items-center justify-between">
              <button
                @click="toggleSidebarModal"
                class="btn btn-sm btn-block bg-slate-700 text-gray-100 hover:bg-white hover:text-slate-700"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      </div>
    </transition>
  </Teleport>

  <Teleport to="#modals">
    <transition
      enter-active-class="transition ease-out duration-300"
      enter-from-class="translate-y-full opacity-0"
      enter-to-class="translate-y-0 opacity-100"
      leave-active-class="transition ease-in duration-300"
      leave-from-class="translate-y-0 opacity-100"
      leave-to-class="translate-y-full opacity-0"
    >
      <div
        v-if="showUploadModal"
        @click.self="toggleUploadModal"
        class="fixed top-0 left-0 w-screen h-screen backdrop-brightness-50 p-10 z-50 max-w-screen max-h-screen"
      >
        <div class="h-full w-full bg-base-100 rounded-xl">
          <div class="flex flex-col gap-2 p-2 h-full w-full">
            <h1 class="text-2xl font-bold text-gray-100">Upload File</h1>
            <div class="flex-1 flex flex-row justify-center items-center">
              <div
                v-if="!fileName"
                class="p-16 rounded-xl flex flex-col items-center justify-center gap-8 h-full w-full"
                @dragover.prevent
                @dragleave.prevent
                @drop="handleDrop"
              >
                <h1 class="text-3xl">
                  Welcome to
                  <span class="cursive-text">Quick Dash </span>&trade;
                </h1>
                <p class="text-xl">Drag and Drop a CSV File Here</p>

                <p>OR</p>

                <button
                  @click="triggerFileInput"
                  class="bg-blue-500 text-gray-100 p-2"
                >
                  Browse for a CSV File
                </button>
                <input
                  type="file"
                  ref="fileInput"
                  class="hidden"
                  accept=".csv"
                  @change="handleFiles"
                  placeholder="Upload File"
                />
              </div>

              <div
                v-if="fileName"
                class="flex flex-col justify-center items-center gap-5"
              >
                <p class="text-3xl">
                  Uploaded:
                  <span class="bg-blue-500 text-gray-100 p-2">
                    {{ fileName }}
                  </span>
                </p>

                <!-- <p>Column / Headers</p>
                <div class="overflow-x-auto border -lg">
                  <table class="table">
                    <thead class="">
                      <tr class="divide-x divide-white text-gray-100">
                        <th v-for="(col, i) in columns">
                          {{ col }}
                        </th>
                      </tr>
                    </thead>
                    <tbody>
                      <tr>
                        <th>1</th>
                        <td>Cy Ganderton</td>
                        <td>Quality Control Specialist</td>
                        <td>Blue</td>
                      </tr>

                      <tr>
                        <th>2</th>
                        <td>Hart Hagerty</td>
                        <td>Desktop Support Technician</td>
                        <td>Purple</td>
                      </tr>

                      <tr>
                        <th>3</th>
                        <td>Brice Swyre</td>
                        <td>Tax Accountant</td>
                        <td>Red</td>
                      </tr>
                    </tbody>
                  </table>
                </div> -->
              </div>
            </div>
            <button
              @click="toggleUploadModal"
              class="btn bg-slate-700 text-gray-100 hover:bg-white hover:text-slate-700"
            >
              Close
            </button>
          </div>
        </div>
      </div>
    </transition>
  </Teleport>

  <!-- LEFT SIDEBAR - Edit User List -->
  <Teleport to="#modals">
    <transition
      enter-active-class="transition ease-out duration-300"
      enter-from-class="-translate-x-full opacity-0"
      enter-to-class="translate-x-0 opacity-100"
      leave-active-class="transition ease-in duration-300"
      leave-from-class="translate-x-0 opacity-100"
      leave-to-class="-translate-x-full opacity-0"
    >
      <div
        v-if="showUsersSidebarModal"
        @click.self="toggleUsersSidebarModal"
        class="fixed top-0 left-0 w-screen h-screen backdrop-brightness-50 z-50 max-w-screen max-h-screen flex flex-col items-start"
      >
        <div class="h-full w-2/3 bg-base-100">
          <div class="flex flex-col gap-2 p-2 h-full w-full">
            <div class="flex flex-row gap-5 items-center p-3">
              <!-- logo image -->

              <h1 class="text-2xl font-bold text-gray-100 text-left">
                <span class="text-white"> Manage Users </span>
              </h1>

              <button
                @click="addUser"
                class="ml-auto btn btn-sm hover:bg-gray-100 hover:text-slate-600 border border-slate-500"
              >
                +
              </button>
            </div>

            <div class="p-2 flex flex-col gap-5 text-white">
              <div class="grid grid-cols-4 gap-3">
                <div
                  class="h-full overflow-y-auto hide-scroll col-span-4 bg-base-100"
                >
                  <table class="table table-zebra table-xs">
                    <!-- head -->
                    <thead class="sticky top-0 bg-base-100 text-gray-100">
                      <tr>
                        <th>Pic</th>
                        <th v-if="showUrlInput">Pic URL</th>
                        <th>First Name</th>
                        <th>Last Name</th>
                        <th
                          class="text-center"
                          v-if="spiffTodayHovered && spiffsToday.length !== 0"
                        >
                          <font-awesome-icon icon="fa-solid fa-trash" />
                        </th>
                      </tr>
                    </thead>
                    <tbody
                      @mouseover="usersHoverOver"
                      @mouseleave="usersHoverLeave"
                    >
                      <!-- row 1 -->
                      <tr v-for="(item, i) in users" :key="i">
                        <td class="flex flex-row gap-3">
                          <img
                            @click="showUrlInput = !showUrlInput"
                            :src="
                              users[i].profile_pic_url ||
                              '/images/default-profile-pic.jpg'
                            "
                            class="w-10 h-10 rounded-full cursor-pointer"
                          />
                        </td>
                        <td v-if="showUrlInput">
                          <input
                            v-if="showUrlInput"
                            type="text"
                            v-model="users[i].profile_pic_url"
                            placeholder="Image URL"
                            class="w-full p-3 bg-transparent text-base rounded border border-slate-600 input"
                          />
                        </td>
                        <td>
                          <input
                            type="text"
                            v-model="users[i].first_name"
                            class="w-full p-3 bg-transparent text-base rounded border border-slate-600 input"
                          />
                        </td>
                        <td>
                          <input
                            type="text"
                            v-model="users[i].last_name"
                            class="w-full p-3 bg-transparent text-base rounded border border-slate-600 input"
                          />
                        </td>
                        <td v-if="spiffTodayHovered">
                          <button
                            @click="confirmUserDelete(i)"
                            class="btn bg-red bg-red-500 text-gray-100 hover:bg-red-700 rounded"
                          >
                            <font-awesome-icon icon="fa-solid fa-xmark" />
                          </button>
                        </td>
                      </tr>
                    </tbody>
                  </table>
                  <div v-if="users.length === 0" class="p-2">
                    <div
                      class="bg-blue-500 p-5 rounded text-gray-100 text-center"
                    >
                      No Users Added Yet
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <div class="flex flex-row items-center justify-between mt-auto">
              <button
                @click="toggleSidebarModal"
                class="btn btn-sm btn-block bg-slate-700 text-gray-100 hover:bg-white hover:text-slate-700"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      </div>
    </transition>
  </Teleport>

  <!-- LEFT SIDEBAR - Edit Extra Records List -->
  <Teleport to="#modals">
    <transition
      enter-active-class="transition ease-out duration-300"
      enter-from-class="-translate-x-full opacity-0"
      enter-to-class="translate-x-0 opacity-100"
      leave-active-class="transition ease-in duration-300"
      leave-from-class="translate-x-0 opacity-100"
      leave-to-class="-translate-x-full opacity-0"
    >
      <div
        v-if="showEnrollmentsSidebarModal"
        @click.self="toggleEnrollmentsSidebarModal"
        class="fixed top-0 left-0 w-screen h-screen backdrop-brightness-50 z-50 max-w-screen max-h-screen flex flex-col items-start"
      >
        <div class="h-full overflow-y-auto w-2/3 bg-base-100">
          <div class="flex flex-col gap-2 p-2 h-full w-full">
            <div class="flex flex-row gap-5 items-center p-3">
              <!-- logo image -->

              <h1 class="text-2xl font-bold text-gray-100 text-left">
                <span class="text-white"> Manage Enrollments </span>
              </h1>
            </div>

            <!-- create enrollment inputs -->
            <div class="flex flex-col gap-5 p-4 rounded">
              <div
                class="border border-slate-500 flex flex-row gap-5 p-5 rounded"
              >
                <select
                  v-model="creatingEnrollment['Sales User']"
                  class="w-full p-3 bg-transparent text-base rounded border border-slate-600 select text-gray-50"
                >
                  <option
                    v-for="option in userSelectOptions"
                    :value="option.value"
                  >
                    {{ option.label }}
                  </option>
                </select>

                <input
                  type="text"
                  v-model="creatingEnrollment['Debt Amount']"
                  class="w-full p-3 bg-transparent text-base rounded border border-slate-600 input text-gray-50"
                  placeholder="Debt Amount"
                />

                <input
                  type="date"
                  v-model="creatingEnrollment['Enrollment Date']"
                  class="w-full p-3 bg-transparent text-base rounded border border-slate-600 input text-gray-50"
                  placeholder="Enrollment Date"
                  @input="
                    enrollmentDate = new Date(enrollmentDate)
                      .toLocaleDateString('en-GB')
                      .split('/')
                      .reverse()
                      .join('-')
                  "
                />
              </div>
              <button
                @click="createEnrollment"
                class="btn bg-blue-500 text-gray-100 hover:bg-blue-700"
              >
                Add Enrollment
              </button>
            </div>

            <div class="p-2 flex flex-col gap-5 text-white">
              <div class="grid grid-cols-4 gap-3">
                <div
                  class="h-full overflow-y-auto hide-scroll col-span-4 bg-base-100"
                >
                  <table class="table table-zebra table-xs">
                    <!-- head -->
                    <thead class="sticky top-0 bg-base-100 text-gray-100">
                      <tr>
                        <th>Sales User</th>
                        <th>Debt Amount</th>
                        <th>Enrolled Date</th>
                        <th
                          class="text-center"
                          v-if="spiffTodayHovered && spiffsToday.length !== 0"
                        >
                          <font-awesome-icon icon="fa-solid fa-trash" />
                        </th>
                      </tr>
                    </thead>
                    <tbody>
                      <!-- row 1 -->
                      <tr v-for="(item, i) in enrollments" :key="i">
                        <td class="flex flex-row gap-3">
                          <select
                            type="text"
                            v-model="enrollments[i]['Sales User']"
                            class="w-full p-3 bg-transparent text-base rounded border border-slate-600 select pointer-events-none cursor-disabled"
                          >
                            <option
                              v-for="option in userSelectOptions"
                              :value="option['value']"
                            >
                              {{ option.label }}
                            </option>
                          </select>
                        </td>
                        <td>
                          <input
                            type="text"
                            v-model="enrollments[i]['Debt Amount']"
                            class="w-full p-3 bg-transparent text-base rounded border border-slate-600 input cursor-not-allowed cursor-disabled"
                          />
                        </td>
                        <td>
                          <!-- native date selector that sets the date like this: 00-00-0000 -->
                          <input
                            type="date"
                            v-model="enrollments[i]['Enrollment Date']"
                            class="w-full p-3 bg-transparent text-base rounded border border-slate-600 input pointer-events-none cursor-disabled"
                            @input="
                              enrollments[i]['Enrollment Date'] = new Date(
                                enrollments[i]['Enrollment Date']
                              )
                                .toLocaleDateString('en-GB')
                                .split('/')
                                .reverse()
                                .join('-')
                            "
                          />
                        </td>
                        <td>
                          <button
                            @click="confirmEnrollmentDelete(i)"
                            class="btn bg-red bg-red-500 text-gray-100 hover:bg-red-700 rounded"
                          >
                            <font-awesome-icon icon="fa-solid fa-xmark" />
                          </button>
                        </td>
                      </tr>
                    </tbody>
                  </table>

                  <!-- <pre>
                    {{ data }}
                  </pre> -->
                  <div v-if="users.length === 0" class="p-2">
                    <div
                      class="bg-blue-500 p-5 rounded text-gray-100 text-center"
                    >
                      No Enrollments Added Yet
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <div class="flex flex-row items-center justify-between mt-auto">
              <button
                @click="toggleSidebarModal"
                class="btn btn-sm btn-block bg-slate-700 text-gray-100 hover:bg-white hover:text-slate-700"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      </div>
    </transition>
  </Teleport>

  <div class="h-screen w-screen flex flex-col bg-base-300">
    <!-- navbar -->
    <div
      class="flex flex-row items-center justify-between p-2 bg-base-100 gap-5"
    >
      <div class="flex flex-row gap-5">
        <img src="/images/landlLogo.png" alt="logo" class="w-12" />

        <div class="text-3xl text-gray-100 cursive-text">
          {{ company_name }}
        </div>
      </div>

      <h1 class="text-xl font-bold text-gray-100">
        <span>
          <select class="appearance-none text-center" v-model="timeRangePeriod">
            <option value="week">Week</option>
            <option value="month">
              {{ timeRangePeriod === "month" ? currentMonth : "Month" }}
            </option>
          </select>
        </span>
        Enrollments ({{ startDate }} - {{ endDate }})
      </h1>

      <div class="flex flex-row items-center gap-2">
        <button
          @click="interval_is_running ? updateData(false) : updateData(true)"
          title="Upload a CSV file"
          :class="
            interval_is_running
              ? 'bg-red-500 hover:bg-red-600'
              : 'bg-emerald-500 hover:bg-emerald-600'
          "
          class="btn bg-blue-500 text-gray-100"
        >
          <font-awesome-icon
            :icon="['fas', interval_is_running ? 'pause' : 'play']"
          />
        </button>
        <button
          v-if="data.length < 1"
          @click="toggleUploadModal"
          title="Upload a CSV file"
          class="btn bg-blue-500 text-gray-100 hover:bg-blue-700"
        >
          <font-awesome-icon :icon="['fas', 'arrow-up-from-bracket']" />
        </button>

        <button
          v-if="data.length > 0 && !interval_is_running"
          @click="wipeData"
          title="Wipe the CSV Data"
          class="btn text-gray-100 bg-red-500 hover:bg-red-700"
        >
          <font-awesome-icon icon="fa-solid fa-arrows-rotate" />
        </button>

        <button
          @click="toggleSidebarModal"
          class="btn text-slate-600 bg-white hover:bg-base-100 hover:text-gray-100"
        >
          <font-awesome-icon icon="fa-solid fa-bars" />
        </button>
        <!-- <img
          class="h-10 w-10 rounded-full"
          src="https://i.pinimg.com/736x/ce/d3/90/ced39071be26c0d491c35492e073c59f.jpg"
          alt=""
        /> -->
      </div>
    </div>
    <!-- leaders -->
    <div class="col-span-3 row-span-1 flex flex-row max-sm:flex-col gap-2">
      <div
        v-if="usersData.length >= 1"
        class="flex-1 bg-amber-500 flex flex-col text-center justify-center glass divide-x"
      >
        <div class="flex flex-row items-center justify-between p-2">
          <!-- profile pic - get the profile pic from the users array of object by the name of the user -->
          <div class="flex flex-row items-center gap-3">
            <div class="flex-shrink-0">
              <img
                :src="
                  users.find(
                    (user) =>
                      `${user.first_name} ${user.last_name}` ===
                      usersData[0]?.sales_user
                  )?.profile_pic_url || '/images/default-profile-pic.jpg'
                "
                class="w-20 rounded-full"
              />
              <h1 class="text-gray-100 text-5xl">1st</h1>
            </div>
          </div>
          <div class="flex flex-col flex-1">
            <div class="text-gray-100 text-3xl flex-1 text-right">
              {{ usersData[0]?.sales_user }}
            </div>
            <div class="text-right">
              <h2 class="text-4xl font-bold text-emerald-600">
                {{
                  `$${
                    isNaN(usersData[0]?.debt_load_total)
                      ? 0
                      : formatWholeNumberWithCommas(
                          usersData[0]?.debt_load_total
                        )
                  }`
                }}
              </h2>
            </div>
          </div>
        </div>
      </div>
      <div
        v-if="usersData.length >= 2"
        class="flex-1 bg-gray-400 flex flex-col text-center justify-center glass divide-x"
      >
        <div class="flex flex-row items-center justify-between p-2">
          <!-- profile pic - get the profile pic from the users array of object by the name of the user -->
          <div class="flex flex-row items-center gap-3">
            <div class="flex-shrink-0">
              <img
                :src="
                  users.find(
                    (user) =>
                      `${user.first_name} ${user.last_name}` ===
                      usersData[1]?.sales_user
                  )?.profile_pic_url || '/images/default-profile-pic.jpg'
                "
                class="w-16 rounded-full"
              />
              <h1 class="text-gray-100 text-3xl">2nd</h1>
            </div>
          </div>
          <div class="flex flex-col flex-1">
            <div class="text-gray-100 text-3xl flex-1 text-right">
              {{ usersData[1]?.sales_user }}
            </div>
            <div class="text-right">
              <h2 class="text-4xl font-bold text-emerald-600">
                {{
                  `$${
                    isNaN(usersData[1]?.debt_load_total)
                      ? 0
                      : formatWholeNumberWithCommas(
                          usersData[1]?.debt_load_total
                        )
                  }`
                }}
              </h2>
            </div>
          </div>
        </div>
      </div>
      <div
        v-if="usersData.length >= 2"
        class="flex-1 bg-amber-900 flex flex-col text-center justify-center glass divide-x"
      >
        <div class="flex flex-row items-center justify-between p-2">
          <!-- profile pic - get the profile pic from the users array of object by the name of the user -->
          <div class="flex flex-col items-center gap-3">
            <div class="flex-shrink-0">
              <img
                :src="
                  users.find(
                    (user) =>
                      `${user.first_name} ${user.last_name}` ===
                      usersData[2]?.sales_user
                  )?.profile_pic_url || '/images/default-profile-pic.jpg'
                "
                class="w-16 rounded-full"
              />
              <h1 class="text-gray-100 text-3xl">3rd</h1>
            </div>
          </div>
          <div class="flex flex-col flex-1">
            <div class="text-gray-100 text-3xl flex-1 text-right">
              {{ usersData[2]?.sales_user }}
            </div>
            <div class="text-right">
              <h2 class="text-4xl font-bold text-emerald-600">
                {{
                  `$${
                    isNaN(usersData[2]?.debt_load_total)
                      ? 0
                      : formatWholeNumberWithCommas(
                          usersData[2]?.debt_load_total
                        )
                  }`
                }}
              </h2>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- dash -->
    <div class="flex flex-row flex-1 min-h-0 overflow-y-auto gap-2 p-2">
      <!-- left column -->
      <div class="bg-base-300 w-1/2 flex flex-col gap-2">
        <div class="bg-base-100 h-full overflow-y-auto">
          <!-- TOP LEFT -->
          <div class="flex flex-col h-full">
            <div
              class="text-gray-100 text-xl flex flex-row justify-between items-center p-2"
            >
              <span class="capitalize"
                >Enrollments by Rep - {{ timeRangePeriod }}</span
              >

              <div class="flex flex-row items-center gap-3">
                <button
                  class="btn btn-sm hover:bg-blue-600 text-blue-500 border border-blue-500 hover:text-gray-50"
                  @click="toggleUsersSidebarModal"
                >
                  <!-- font aweomse icon -->

                  <font-awesome-icon icon="fa-solid fa-user" />
                </button>

                <button
                  @click.stop="toggleEnrollmentsSidebarModal"
                  class="btn btn-sm hover:bg-gray-100 hover:text-slate-600 border border-slate-500"
                >
                  +
                </button>
              </div>
            </div>
            <div class="flex-1 flex flex-col">
              <!-- <Chart
                :data="userChartData"
                :options="userChartOptions"
                v-if="refreshData"
              /> -->

              <!-- Table Enrollments by rep - object example = { profile_pic_url } -->
              <div class="">
                <div class="overflow-x-auto">
                  <table class="table table-zebra">
                    <!-- head -->
                    <thead>
                      <tr>
                        <th class="text-gray-50">Rank</th>
                        <th class="text-gray-50">Consultant</th>
                        <th class="text-gray-50">Deals</th>
                        <th class="text-gray-50">Debt Load</th>
                      </tr>
                    </thead>
                    <tbody>
                      <!-- row 1 -->
                      <tr v-for="(user, i) in usersData" :key="i">
                        <td class="text-gray-50 text-lg text-center">
                          {{ i + 1 }}
                        </td>
                        <td>
                          <div class="flex items-center gap-3">
                            <div class="avatar">
                              <div class="mask mask-squircle h-12 w-12">
                                <img
                                  :src="
                                    users.find(
                                      (u) =>
                                        `${u.first_name} ${u.last_name}` ===
                                        user.sales_user
                                    )?.profile_pic_url ||
                                    '/images/default-profile-pic.jpg'
                                  "
                                  alt="Avatar Tailwind CSS Component"
                                />
                              </div>
                            </div>
                            <div>
                              <div class="font-bold text-gray-50 text-xl">
                                {{ user.sales_user }}
                              </div>
                              <!-- <div class="text-sm opacity-50">
                                United States
                              </div> -->
                            </div>
                          </div>
                        </td>

                        <td class="text-red-400 text-3xl">
                          {{ user.deal_count }}
                        </td>
                        <th class="text-emerald-400 text-2xl">
                          ${{
                            formatWholeNumberWithCommas(user.debt_load_total)
                          }}
                        </th>
                      </tr>
                    </tbody>
                  </table>
                </div>
              </div>

              <!-- <pre>
                {{ usersData }}
              </pre> -->
            </div>
          </div>
        </div>

        <!-- <div
          v-if="leftColumnView === 'both' || leftColumnView === 'chart'"
          :class="`${
            leftColumnView === 'both'
              ? 'h-1/2'
              : leftColumnView === 'chart'
              ? 'h-full'
              : ''
          }`"
          class="bg-base-100"
        >
          <div class="">
            <div
              @click="
                leftColumnView === 'both'
                  ? (leftColumnView = 'chart')
                  : leftColumnView === 'chart'
                  ? (leftColumnView = 'table')
                  : (leftColumnView = 'both')
              "
              class="text-gray-100 text-xl flex flex-row justify-between items-center p-2 cursor-pointer hover:bg-gray-600"
            >
              <span> New Clients - Today </span>

              <button
                class="ml-auto btn btn-sm hover:bg-gray-100 hover:text-slate-600 border border-slate-500"
              >
                +
              </button>
            </div>

            <div class="flex-1 flex flex-col text-5xl">
              <div class="overflow-y-auto">
                <table class="table table-zebra">
                  <thead class="text-gray-100">
                    <tr>
                      <th>Program Consultant</th>
                      <th>Client Name</th>
                      <th
                        v-show="
                          enabledBlocks.includes('average_program_length')
                        "
                      >
                        Term
                      </th>
                      <th>Total Debt</th>
                    </tr>
                  </thead>
                  <tbody class="text-gray-100">
                    <tr v-for="(item, i) in newClientsToday" :key="i">
                      <td>{{ item["Sales User"] }}</td>
                      <th>{{ item["Customer Name"] }}</th>
                      <td
                        v-show="
                          enabledBlocks.includes('average_program_length')
                        "
                      >
                        {{ item["Term"] }}
                      </td>
                      <td>{{ item["Debt Amount"] }}</td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </div> -->
      </div>

      <!-- RIGHT COLUMN -->
      <div class="bg-base-300 w-1/2 h-full overflow-y-auto flex flex-col gap-2">
        <!-- Debt Goal - Row 1 -->
        <div class="col-span-3 bg-base-300 flex flex-col h-1/3">
          <div class="flex-1 bg-base-100 p-2 flex flex-col">
            <div class="text-gray-100 text-xl">
              Enrolled Debt -
              <span class="capitalize">{{ timeRangePeriod }}</span>
            </div>

            <div
              class="text-center flex-1 flex flex-col items-center justify-center"
            >
              <h1 class="text-green-400 text-6xl">
                ${{
                  Number.isNaN(Number(totalDebtWeek[0]))
                    ? 0
                    : formatWholeNumberWithCommas(totalDebtWeek[0])
                }}
              </h1>
            </div>

            <div class="">
              <Chart
                :data="goalChartData"
                :options="goalChartOptions"
                v-if="refreshData"
              />
            </div>
          </div>
        </div>

        <!-- Right - Row 2 -->
        <div class="col-span-1 bg-base-300 flex flex-row gap-2 h-1/6">
          <div class="flex-1 bg-base-100 rounded p-2 flex flex-col">
            <div class="text-gray-100 text-xl">
              Enrolled Debt <br />
              - Today
            </div>
            <div
              class="flex-1 flex flex-col justify-center items-center text-5xl text-blue-400"
            >
              {{ sumDebtsOnDate(today) }}
            </div>
          </div>
          <div class="flex-1 bg-base-100 rounded p-2 flex flex-col">
            <div class="text-gray-100 text-xl">
              Average Debt / Client<br />
              - <span class="capitalize">{{ timeRangePeriod }}</span>
            </div>
            <div
              class="flex-1 flex flex-col justify-center items-center text-5xl text-yellow-400"
            >
              {{ averageDebtAmount }}
            </div>
          </div>
        </div>

        <!-- Right - Row 3 -->
        <div class="col-span-1 flex flex-row gap-2 h-1/6">
          <div class="flex-1 bg-base-100 flex flex-col p-2">
            <div class="text-gray-100 text-xl">
              Enrollments <br />
              - Today
            </div>
            <div
              class="flex-1 flex flex-col justify-center items-center text-5xl text-rose-400"
            >
              {{ clientsEnrolledToday }}
            </div>
          </div>
          <div
            v-show="enabledBlocks.includes('average_program_length')"
            class="flex-1 bg-base-100 flex flex-col p-2"
          >
            <div class="text-gray-100 text-xl">
              Average Program Length <br />
              - <span class="capitalize">{{ timeRangePeriod }}</span>
            </div>
            <div
              class="flex-1 flex flex-col justify-center items-center text-5xl text-purple-400"
            >
              {{ averageProgramLength === "NaN" ? 0 : averageProgramLength }}
            </div>
          </div>
          <div class="flex-1 bg-base-100 flex flex-col p-2">
            <div class="text-gray-100 text-xl">
              Clients Enrolled <br />
              - <span class="capitalize">{{ timeRangePeriod }}</span>
            </div>
            <div
              class="flex-1 flex flex-col justify-center items-center text-5xl text-sky-400"
            >
              {{ clientsEnrolledWeek }}
            </div>
          </div>
        </div>

        <!-- spiff adders -->
        <div class="bg-base-300 flex flex-row divide-slate-400 gap-2 h-1/2">
          <div class="h-full hide-scroll w-1/2 bg-base-100">
            <div class="flex flex-row items-center p-2">
              <div class="text-gray-100 text-xl">Spiffs - Today</div>
              <button
                @click="spiffAdderToday"
                class="ml-auto btn btn-sm hover:bg-gray-100 hover:text-slate-600 border border-slate-500"
              >
                +
              </button>
            </div>
            <table class="table table-zebra table-xs">
              <!-- head -->
              <thead class="sticky top-0 bg-base-100 text-gray-100">
                <tr>
                  <th>Rep</th>
                  <th>Spiff</th>
                  <th
                    class="text-center"
                    v-if="spiffTodayHovered && spiffsToday.length !== 0"
                  >
                    <font-awesome-icon icon="fa-solid fa-trash" />
                  </th>
                </tr>
              </thead>
              <tbody
                @mouseover="spiffTodayHoverOver"
                @mouseleave="spiffTodayHoverLeave"
              >
                <!-- row 1 -->
                <tr v-for="(item, i) in spiffsToday" :key="i">
                  <td>
                    <input
                      type="text"
                      v-model="spiffsToday[i].sales_rep"
                      class="w-full p-1 bg-transparent text-base text-gray-100 rounded"
                    />
                  </td>
                  <td>
                    <input
                      type="text"
                      v-model="spiffsToday[i].spiff_amount"
                      class="w-full text-emerald-500 p-1 bg-transparent text-base rounded"
                    />
                  </td>
                  <td v-if="spiffTodayHovered">
                    <button
                      @click="spiffsToday.splice(i, 1)"
                      class="btn btn-sm bg-red bg-red-500 text-gray-100 hover:bg-red-700 rounded"
                    >
                      <font-awesome-icon icon="fa-solid fa-xmark" />
                    </button>
                  </td>
                </tr>
              </tbody>
            </table>
            <div v-if="spiffsToday.length === 0" class="p-2">
              <div class="bg-blue-500 p-5 rounded text-gray-100 text-center">
                No Spiffs Today Yet
              </div>
            </div>
          </div>
          <div class="h-full hide-scroll w-1/2 bg-base-100">
            <div class="flex flex-row items-center p-2">
              <div class="text-gray-100 text-xl">
                Spiffs - <span class="capitalize">{{ timeRangePeriod }}</span>
              </div>
              <button
                @click="spiffAdderWeek"
                class="ml-auto btn btn-sm hover:bg-gray-100 hover:text-slate-600 border border-slate-500"
              >
                +
              </button>
            </div>
            <table class="table table-zebra table-xs">
              <!-- head -->
              <thead class="sticky top-0 bg-base-100 text-gray-100">
                <tr>
                  <th>Rep</th>
                  <th>Spiff</th>
                  <th
                    class="text-center"
                    v-if="spiffWeekHovered && spiffsWeek.length !== 0"
                  >
                    <font-awesome-icon icon="fa-solid fa-trash" />
                  </th>
                </tr>
              </thead>
              <tbody
                @mouseover="spiffWeekHoverOver"
                @mouseleave="spiffWeekHoverLeave"
              >
                <!-- row 1 -->
                <tr v-for="(item, i) in spiffsWeek" :key="i">
                  <td>
                    <input
                      type="text"
                      v-model="spiffsWeek[i].sales_rep"
                      class="w-full p-1 bg-transparent text-base rounded text-gray-100"
                    />
                  </td>
                  <td>
                    <input
                      type="text"
                      v-model="spiffsWeek[i].spiff_amount"
                      class="w-full text-emerald-500 p-1 bg-transparent text-base rounded"
                    />
                  </td>
                  <td v-if="spiffWeekHovered">
                    <button
                      @click="spiffsWeek.splice(i, 1)"
                      class="btn btn-sm bg-red bg-red-500 text-gray-100 hover:bg-red-700 rounded"
                    >
                      <font-awesome-icon icon="fa-solid fa-xmark" />
                    </button>
                  </td>
                </tr>
              </tbody>
            </table>
            <div v-if="spiffsWeek.length === 0" class="p-2">
              <div class="bg-blue-500 p-5 rounded text-gray-100 text-center">
                No Spiffs This Week Yet
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.hide-scroll::-webkit-scrollbar {
  display: none;
}

.cursive-text {
  font-family: "Dancing Script", cursive;
}
</style>
