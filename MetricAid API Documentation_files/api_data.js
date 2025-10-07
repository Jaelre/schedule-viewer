define({ "api": [
  {
    "version": "1.0.0",
    "name": "CreateDirectTrade",
    "group": "Create_-_Trades",
    "description": "<p>Create a direct trade to be published to the marketplace. (You can currently only trade your own slots, not post on behalf)</p>",
    "parameter": {
      "fields": {
        "Body Parameters": [
          {
            "group": "Body Parameters",
            "type": "integer",
            "size": "1-&infin;",
            "optional": false,
            "field": "directTrade",
            "description": "<p>Data for the trade to be posted</p>"
          },
          {
            "group": "Body Parameters",
            "type": "integer",
            "size": "1-&infin;",
            "optional": false,
            "field": "directTrade.source_slot_provider_id",
            "description": "<p><u>directTrade.source_slot_provider_id</u><br> The source slot_provider ID for the slot being posted</p>"
          },
          {
            "group": "Body Parameters",
            "type": "integer",
            "size": "1-&infin;",
            "optional": false,
            "field": "directTrade.source_provider_id",
            "description": "<p><u>directTrade.source_provider_id</u><br> The source user ID for the slot being posted</p>"
          },
          {
            "group": "Body Parameters",
            "type": "integer",
            "size": "1-&infin;",
            "optional": false,
            "field": "directTrade.target_slot_provider_id",
            "description": "<p><u>directTrade.target_slot_provider_id</u><br> The target slot_provider ID for the slot being posted</p>"
          },
          {
            "group": "Body Parameters",
            "type": "integer",
            "size": "1-&infin;",
            "optional": false,
            "field": "directTrade.target_provider_id",
            "description": "<p><u>directTrade.target_provider_id</u><br> The target user ID for the slot being posted</p>"
          },
          {
            "group": "Body Parameters",
            "type": "string",
            "size": "1-250",
            "optional": true,
            "field": "directTrade.note",
            "defaultValue": "``",
            "description": "<p><u>directTrade.note</u><br> An optional note attached to the direct trade</p>"
          }
        ]
      },
      "examples": [
        {
          "title": "Post a direct trade",
          "content": "Post a direct trade:\n {\n     \"directTrade\": {\n         \"source_slot_provider_id\": 1,\n         \"source_provider_id\" : 12,\n         \"target_slot_provider_id\": 1,\n         \"target_provider_id\" : 12,\n     }\n }\nPost a direct trade with a note:\n {\n     \"directTrade\": {\n         \"source_slot_provider_id\": 1,\n         \"source_provider_id\" : 12,\n         \"target_slot_provider_id\": 1,\n         \"target_provider_id\" : 12,\n         \"note\" : \"Jim, I really need you to do me a solid... Thanks!\"\n     }\n }",
          "type": "json"
        }
      ]
    },
    "type": "",
    "url": "",
    "filename": "./routes/v1/create/trades/directTrade.js",
    "groupTitle": "Create_-_Trades",
    "header": {
      "fields": {
        "Header": [
          {
            "group": "Header",
            "type": "String",
            "optional": false,
            "field": "Authorization",
            "description": "<p>The API Authorization Token. Without this token, no endpoint will be reachable. Value should follow the format &quot;Bearer: MY_TOKEN_HERE&quot;. Please see this example for more information: https://stackoverflow.com/a/22565038.</p>"
          }
        ]
      }
    }
  },
  {
    "version": "1.0.0",
    "name": "CreateResponseProposal",
    "group": "Create_-_Trades",
    "description": "<p>Create a trade response proposal</p>",
    "parameter": {
      "fields": {
        "Body Parameters": [
          {
            "group": "Body Parameters",
            "type": "integer",
            "size": "1-&infin;",
            "optional": false,
            "field": "postingID",
            "description": "<p><u>postingID</u><br> The ID on the trade posting being responded to</p>"
          },
          {
            "group": "Body Parameters",
            "type": "integer",
            "size": "1-&infin;",
            "optional": false,
            "field": "status",
            "description": "<p><u>status</u><br> The response the user is giving:<br> 1: Accept<br> 2: Decline</p>"
          },
          {
            "group": "Body Parameters",
            "type": "integer",
            "size": "1-&infin;",
            "optional": true,
            "field": "selectedShifts",
            "description": "<p><u>selectedShifts</u><br> Optional array of slot provider</p>"
          }
        ]
      },
      "examples": [
        {
          "title": "Post a trade response to a giveaway trade posting",
          "content": "Post a response accepting a trade giveaway with ID: 2021\n {\n    \"postingID\": 2021,\n    \"status\": 1,\n    \"selectedShifts\" : []\n }\n Post a response declining a giveaway trade with ID: 2021\n {\n    \"postingID\": 2021,\n    \"status\": 2,\n    \"selectedShifts\" : []\n }",
          "type": "json"
        },
        {
          "title": "Post a trade response to a trade type trade posting",
          "content": "Post a response accepting a trade type trade posting with ID: 2021, offering 3 slot_providers to as a choice\n {\n    \"postingID\": 2021,\n    \"status\": 1,\n    \"selectedShifts\" : [1,2,3]\n }\n Post a response declining a trade giveaway with ID: 2021, offering 3 slot_providers to as a choice\n {\n    \"postingID\": 2021,\n    \"status\": 2,\n    \"selectedShifts\" : []\n }",
          "type": "json"
        },
        {
          "title": "Post a trade response to a trade/giveaway type trade posting",
          "content": "Post a response accepting a trade/giveaway type trade posting with ID: 2021, accepting the trade as a giveaway\n {\n    \"postingID\": 2021,\n    \"status\": 1,\n    \"selectedShifts\" : [1,2,3]\n }\n Post a response declining a trade/giveaway giveaway with ID: 2021, offering 3 slot_providers to as a choice\n {\n    \"postingID\": 2021,\n    \"status\": 2,\n    \"selectedShifts\" : []\n }",
          "type": "json"
        }
      ]
    },
    "type": "",
    "url": "",
    "filename": "./routes/v1/create/trades/responseProposal.js",
    "groupTitle": "Create_-_Trades",
    "header": {
      "fields": {
        "Header": [
          {
            "group": "Header",
            "type": "String",
            "optional": false,
            "field": "Authorization",
            "description": "<p>The API Authorization Token. Without this token, no endpoint will be reachable. Value should follow the format &quot;Bearer: MY_TOKEN_HERE&quot;. Please see this example for more information: https://stackoverflow.com/a/22565038.</p>"
          }
        ]
      }
    }
  },
  {
    "version": "1.0.0",
    "name": "CreateTradeAcknowledgement",
    "group": "Create_-_Trades",
    "description": "<p>Create a trade response Acknowledgement - Used for accepting a response proposal.</p>",
    "parameter": {
      "fields": {
        "Body Parameters": [
          {
            "group": "Body Parameters",
            "type": "integer",
            "size": "1-&infin;",
            "optional": false,
            "field": "responseID",
            "description": "<p><u>responseID</u><br> The ID on the trade response being acknowledged</p>"
          },
          {
            "group": "Body Parameters",
            "type": "integer",
            "size": "1-&infin;",
            "optional": false,
            "field": "status",
            "description": "<p><u>status</u><br> The response the user is giving:<br> 1: Accept<br> 2: Decline</p>"
          }
        ]
      },
      "examples": [
        {
          "title": "Create an acknoweledgment to responseID 1998",
          "content": "Post an acknowledgement accepting the response proposal with id 1998\n {\n    \"responseID\": 1998,\n    \"status\": 1,\n }\n Post an acknowledgement declining the response proposal with id 1998\n {\n    \"responseID\": 1998,\n    \"status\": 2,\n }",
          "type": "json"
        }
      ]
    },
    "type": "",
    "url": "",
    "filename": "./routes/v1/create/trades/tradeAcknowledgement.js",
    "groupTitle": "Create_-_Trades",
    "header": {
      "fields": {
        "Header": [
          {
            "group": "Header",
            "type": "String",
            "optional": false,
            "field": "Authorization",
            "description": "<p>The API Authorization Token. Without this token, no endpoint will be reachable. Value should follow the format &quot;Bearer: MY_TOKEN_HERE&quot;. Please see this example for more information: https://stackoverflow.com/a/22565038.</p>"
          }
        ]
      }
    }
  },
  {
    "version": "1.0.0",
    "name": "CreateTradePosting",
    "group": "Create_-_Trades",
    "description": "<p>Create a trade posting to be published to the marketplace. (You can currently only trade your own slots, not post on behalf)</p>",
    "parameter": {
      "fields": {
        "Body Parameters": [
          {
            "group": "Body Parameters",
            "type": "integer",
            "size": "1-&infin;",
            "optional": false,
            "field": "tradePosting",
            "description": "<p>Data for the trade to be posted</p>"
          },
          {
            "group": "Body Parameters",
            "type": "integer",
            "size": "1-&infin;",
            "optional": false,
            "field": "tradePosting.slot_provider_id",
            "description": "<p><u>tradePosting.slot_provider_id</u><br> The slot_provider ID for the slot being posted</p>"
          },
          {
            "group": "Body Parameters",
            "type": "integer",
            "size": "0-2",
            "optional": false,
            "field": "tradePosting.type",
            "description": "<p><u>tradePosting.type</u><br> The type of posting being made: <br> 0: Giveaway<br>1: Trade <br>2: Trade/Giveaway</p>"
          },
          {
            "group": "Body Parameters",
            "type": "integer[]",
            "size": "1-&infin;",
            "optional": true,
            "field": "tradePosting.targetted_users",
            "defaultValue": "[]",
            "description": "<p><u>tradePosting.targetted_users</u><br> The slot_provider ID for the slot being posted</p>"
          },
          {
            "group": "Body Parameters",
            "type": "string",
            "optional": true,
            "field": "tradePosting.note",
            "defaultValue": "``",
            "description": "<p><u>tradePosting.note</u><br> An optional note attached to the trade posting</p>"
          }
        ]
      },
      "examples": [
        {
          "title": "Post a slot trade",
          "content": "Post a trade with no targetted users and no note:\n {\n     \"tradePosting\": {\n         \"slot_provider_id\": 1,\n         \"type\": 0\n     }\n }\nPost a trade with targetted users and a note:\n {\n     \"tradePosting\":{\n         \"slot_provider_id\": 1,\n         \"type\": 0,\n         \"targetted_users\": [10,20,30,40,50],\n         \"note\": \"I'll trade with anyone, I need to go for my surgery this day.\"\n     }\n }",
          "type": "json"
        },
        {
          "title": "Post a slot giveaway",
          "content": "Post a giveaway with no targetted users and no note:\n {\n     \"tradePosting\":{\n         \"slot_provider_id\": 1,\n         \"type\": 1\n     }\n }\nPost a giveaway with targetted users and a note:\n {\n     \"tradePosting\":{\n         \"slot_provider_id\": 1,\n         \"type\": 1,\n         \"targetted_users\": [10,20,30,40,50],\n         \"note\": \"I'll probably be sick this day\"\n     }\n }",
          "type": "json"
        },
        {
          "title": "Post a trade/giveaway",
          "content": "Post a trade/giveaway with no targetted users and no note:\n {\n     \"tradePosting\":{\n         \"slot_provider_id\": 1,\n         \"type\": 2\n     }\n }\nPost a trade/giveaway with targetted users and a note:\n {\n     \"tradePosting\":{\n         \"slot_provider_id\": 1,\n         \"type\": 2,\n         \"targetted_users\": [10,20,30,40,50],\n         \"note\": \"Please take, I'm desperate!\n     }\n }",
          "type": "json"
        }
      ]
    },
    "type": "",
    "url": "",
    "filename": "./routes/v1/create/trades/tradePostings.js",
    "groupTitle": "Create_-_Trades",
    "header": {
      "fields": {
        "Header": [
          {
            "group": "Header",
            "type": "String",
            "optional": false,
            "field": "Authorization",
            "description": "<p>The API Authorization Token. Without this token, no endpoint will be reachable. Value should follow the format &quot;Bearer: MY_TOKEN_HERE&quot;. Please see this example for more information: https://stackoverflow.com/a/22565038.</p>"
          }
        ]
      }
    }
  },
  {
    "version": "1.0.0",
    "name": "AppVersions",
    "group": "Retrieve_-_AppVersions",
    "description": "<p>Retrieve Versions of the app with notes</p>",
    "parameter": {
      "fields": {
        "Body Parameters": [
          {
            "group": "Body Parameters",
            "type": "boolean",
            "optional": true,
            "field": "includeNotes",
            "defaultValue": "true",
            "description": "<p>include all the update notes with each versions (if any exists)</p>"
          },
          {
            "group": "Body Parameters",
            "type": "boolean",
            "optional": true,
            "field": "lastMandatoryOnly",
            "defaultValue": "false",
            "description": "<p>if true grab all versions up to and including the most recent mandatory version</p>"
          }
        ]
      },
      "examples": [
        {
          "title": "Get app versions",
          "content": "{\n\n}\n{\n  \"includeNotes\": false\n}\n{\n  \"lastMandatoryOnly\": true\n}\n{\n  \"lastMandatoryOnly\": true,\n  \"includeNotes\": false\n}",
          "type": "json"
        }
      ]
    },
    "type": "",
    "url": "",
    "filename": "./routes/meta/versions.js",
    "groupTitle": "Retrieve_-_AppVersions",
    "header": {
      "fields": {
        "Header": [
          {
            "group": "Header",
            "type": "String",
            "optional": false,
            "field": "Authorization",
            "description": "<p>The API Authorization Token. Without this token, no endpoint will be reachable. Value should follow the format &quot;Bearer: MY_TOKEN_HERE&quot;. Please see this example for more information: https://stackoverflow.com/a/22565038.</p>"
          }
        ]
      }
    }
  },
  {
    "version": "1.0.0",
    "name": "RetrieveDraftSchedule",
    "group": "Retrieve_-_DraftSchedule",
    "description": "<p>Retrieves slots with the providers with user data, shift info. Equivalent date slots, are ordered increasingly. Filterable by a date, or date range, with siteIDs and userIDs options. Note all dates must be in YYYY-MM-DD ISO format</p>",
    "parameter": {
      "fields": {
        "Body Parameters": [
          {
            "group": "Body Parameters",
            "type": "dateString|object",
            "optional": false,
            "field": "date",
            "defaultValue": "The current UTC date in 'YYYY-MM-DD' format",
            "description": "<p>A complete date in ISO format: <a href=\"https://www.w3.org/TR/NOTE-datetime\"> Valid Formats</a><br></p> <p>OR <p><u>A date range Object with a &quot;from&quot; and &quot;to&quot; field:</u></p> {</p> <p>&nbsp;&nbsp;&nbsp;\"from\": <b>\"YYYY-MM-DD\"</b></p> <p>&nbsp;&nbsp;&nbsp;\"to\": <b>\"YYYY-MM-DD\"</b> (Must be greater than date.from)</p> }"
          },
          {
            "group": "Body Parameters",
            "type": "integer|integer[]",
            "size": "1-&infin;",
            "optional": true,
            "field": "siteIDs",
            "defaultValue": "All authenticated sites",
            "description": "<p>What sites should the slots be filtered for. Defaults to all available if excluded or empty.</p>"
          },
          {
            "group": "Body Parameters",
            "type": "integer",
            "size": "1 - &infin;",
            "optional": true,
            "field": "page",
            "defaultValue": "1&#09;&#09;\"Unless&nbsp;turned&nbsp;off&nbsp;in&nbsp;ENVIROMENT&nbsp;VARIABLES\"",
            "description": "<p>What page of data should be loaded.</p>"
          },
          {
            "group": "Body Parameters",
            "type": "integer",
            "size": "10 - 250",
            "optional": true,
            "field": "limit",
            "defaultValue": "10&#09;&#09;\"Unless&nbsp;turned&nbsp;off&nbsp;in&nbsp;ENVIROMENT&nbsp;VARIABLES\"",
            "description": "<p>How many results to return per page.</p>"
          }
        ]
      },
      "examples": [
        {
          "title": "Get slots with providers for a date:",
          "content": "Retrieve slots for January 25th, 2020:\n    {\n      \"date\": \"2020-01-25\"\n    }\nFilter by a siteIDs on that date:\n    {\n      \"date\": \"2020-04-05\",\n      \"siteIDs\": [184]\n    }",
          "type": "json"
        },
        {
          "title": "Get slots with providers for a dateRange:",
          "content": "Retrieve slots for the month of January 2020: (Note: This route may be slow for system admins, or for large date ranges.)\n    {\n      \"date\": {\n                 \"from\": \"2020-01-01\",\n                 \"to\": \"2020-01-31\"\n              }\n    }\nFilter by userIDs for a date range:\n    {\n      \"date\": {\n                 \"from\": \"2020-01-25\",\n                 \"to\": \"2020-11-08\"\n              },\n    }\nFilter by siteIDs for a date range:\n    {\n      \"date\": {\n                 \"from\": \"2020-07-02\",\n                 \"to\": \"2020-09-10\"\n              },\n      \"siteIDs\": [64,107,61]\n    }",
          "type": "json"
        }
      ]
    },
    "type": "",
    "url": "",
    "filename": "./routes/v1/retrieve/schedules/draftSchedule.js",
    "groupTitle": "Retrieve_-_DraftSchedule",
    "header": {
      "fields": {
        "Header": [
          {
            "group": "Header",
            "type": "String",
            "optional": false,
            "field": "Authorization",
            "description": "<p>The API Authorization Token. Without this token, no endpoint will be reachable. Value should follow the format &quot;Bearer: MY_TOKEN_HERE&quot;. Please see this example for more information: https://stackoverflow.com/a/22565038.</p>"
          }
        ]
      }
    }
  },
  {
    "version": "1.0.0",
    "name": "Is_User_a_System_Admin",
    "group": "Retrieve_-_Permissions",
    "description": "<p>Retrieve data specifying whether the authenticated user has system level permissions</p>",
    "success": {
      "fields": {
        "Success 200": [
          {
            "group": "Success 200",
            "type": "object",
            "optional": false,
            "field": "data",
            "description": ""
          },
          {
            "group": "Success 200",
            "type": "boolean",
            "optional": false,
            "field": "data.isSystemAdmin",
            "description": "<p>Self explanatory?</p>"
          }
        ]
      }
    },
    "parameter": {
      "examples": [
        {
          "title": "Get all sites the active User can access:",
          "content": "Retrieve all authenticated sites (Empty Body):\n    {\n\n    }",
          "type": "json"
        }
      ]
    },
    "type": "",
    "url": "",
    "filename": "./routes/v1/retrieve/permissions/post.js",
    "groupTitle": "Retrieve_-_Permissions",
    "header": {
      "fields": {
        "Header": [
          {
            "group": "Header",
            "type": "String",
            "optional": false,
            "field": "Authorization",
            "description": "<p>The API Authorization Token. Without this token, no endpoint will be reachable. Value should follow the format &quot;Bearer: MY_TOKEN_HERE&quot;. Please see this example for more information: https://stackoverflow.com/a/22565038.</p>"
          }
        ]
      }
    }
  },
  {
    "version": "1.0.0",
    "name": "RetrieveSlotProviders",
    "group": "Retrieve_-_Providers",
    "description": "<p>Retrieves providers with slots and site and shift, any ids the user hasnt access to won't return.</p>",
    "parameter": {
      "fields": {
        "Body Parameters": [
          {
            "group": "Body Parameters",
            "type": "integer|integer[]",
            "size": "1-&infin;",
            "optional": false,
            "field": "slotProviderIDs",
            "description": "<p>slot provider IDs to filter for</p>"
          },
          {
            "group": "Body Parameters",
            "type": "integer",
            "size": "1 - &infin;",
            "optional": true,
            "field": "page",
            "defaultValue": "1&#09;&#09;\"Unless&nbsp;turned&nbsp;off&nbsp;in&nbsp;ENVIROMENT&nbsp;VARIABLES\"",
            "description": "<p>What page of data should be loaded.</p>"
          },
          {
            "group": "Body Parameters",
            "type": "integer",
            "size": "10 - 250",
            "optional": true,
            "field": "limit",
            "defaultValue": "10&#09;&#09;\"Unless&nbsp;turned&nbsp;off&nbsp;in&nbsp;ENVIROMENT&nbsp;VARIABLES\"",
            "description": "<p>How many results to return per page.</p>"
          }
        ]
      },
      "examples": [
        {
          "title": "Get providers with slots and sites and shifts:",
          "content": "{\n  \"slotProviderIDs\": [345345,4234234]\n}\n{\n  \"slotProviderIDs\": [4234234]\n}\n{\n  \"slotProviderIDs\": 345345\n}",
          "type": "json"
        }
      ]
    },
    "type": "",
    "url": "",
    "filename": "./routes/v1/retrieve/slots/retreiveProvidersByID.js",
    "groupTitle": "Retrieve_-_Providers",
    "header": {
      "fields": {
        "Header": [
          {
            "group": "Header",
            "type": "String",
            "optional": false,
            "field": "Authorization",
            "description": "<p>The API Authorization Token. Without this token, no endpoint will be reachable. Value should follow the format &quot;Bearer: MY_TOKEN_HERE&quot;. Please see this example for more information: https://stackoverflow.com/a/22565038.</p>"
          }
        ]
      }
    }
  },
  {
    "version": "2.0.0",
    "name": "RetrieveSchedule",
    "group": "Retrieve_-_Schedule",
    "description": "<p>Retrieves slots with the providers with user data, shift info. Equivalent date slots, are ordered increasingly. Filterable by a date, or date range, with siteIDs and userIDs options. Note all dates must be in YYYY-MM-DD ISO format</p>",
    "parameter": {
      "fields": {
        "Body Parameters": [
          {
            "group": "Body Parameters",
            "type": "string|object",
            "optional": false,
            "field": "date",
            "defaultValue": "today",
            "description": "<p>date</p>A complete date in ISO format: <a href=\"https://www.w3.org/TR/NOTE-datetime\"> Valid Formats</a><br>"
          },
          {
            "group": "Body Parameters",
            "type": "string",
            "optional": true,
            "field": "date.from",
            "defaultValue": "today",
            "description": "<p>date.from</p>A complete date in ISO format: \"YYYY-MM-DD\" Note: Must be less than date.to"
          },
          {
            "group": "Body Parameters",
            "type": "string",
            "optional": true,
            "field": "date.to",
            "defaultValue": "today",
            "description": "<p>date.to</p>A complete date in ISO format: \"YYYY-MM-DD\" Note: Must be greater than date.from"
          },
          {
            "group": "Body Parameters",
            "type": "integer|integer[]",
            "size": "1-&infin;",
            "optional": true,
            "field": "siteIDs",
            "defaultValue": "All authenticated sites",
            "description": "<p>What sites should the slots be filtered for. Defaults to all available if excluded or empty.</p>"
          },
          {
            "group": "Body Parameters",
            "type": "integer|integer[]",
            "size": "1-&infin;",
            "optional": true,
            "field": "userIDs",
            "defaultValue": "All Users",
            "description": "<p>Filter for specific users. If omitted or an empty array, all users and shifts without someone working will be included.</p>"
          },
          {
            "group": "Body Parameters",
            "type": "boolean",
            "optional": true,
            "field": "includeTradeData",
            "defaultValue": "true",
            "description": "<p>Include Trade data the authenticated user is part of.</p> <p>sourceDirectTrades: Contains direct trades the authenticated user has created. (Appears on authenticated user's slot_providers</p> <p>targetDirectTrades: Contains direct trades the authenticated user can respond to. (Appears on others slot_providers) </p> <p>targettedDirectTrades: Contains direct trades the authenticated user has created. (Appears on other users slot_providers)</p> <p>tradePostings: Any trade posting that created for the slot_provider</p>"
          }
        ]
      },
      "examples": [
        {
          "title": "Get slots with providers for a date:",
          "content": "Retrieve slots for January 25th, 2020:\n    {\n      \"date\": \"2020-01-25\"\n    }\nFilter by a UserID on that date:\n    {\n      \"date\": \"2020-04-05\",\n      \"userIDs\": [2417]\n    }\nFilter by a siteIDs on that date:\n    {\n      \"date\": \"2020-04-05\",\n      \"siteIDs\": [184]\n    }\nFilter by both Sites and Users on that date:\n    {\n      \"date\": \"2020-04-05\",\n      \"userIDs\": [2417, 2418],\n      \"siteIDs\":[184,38]\n    }",
          "type": "json"
        },
        {
          "title": "Get slots with providers for a dateRange:",
          "content": "Retrieve slots for the month of January 2020: (Note: This route may be slow for system admins, or for large date ranges.)\n    {\n      \"date\": {\n                 \"from\": \"2020-01-01\",\n                 \"to\": \"2020-01-31\"\n              }\n    }\nFilter by userIDs for a date range:\n    {\n      \"date\": {\n                 \"from\": \"2020-01-25\",\n                 \"to\": \"2020-11-08\"\n              },\n      \"userIDs\": [2417, 2418]\n    }\nFilter by siteIDs for a date range:\n    {\n      \"date\": {\n                 \"from\": \"2020-07-02\",\n                 \"to\": \"2020-09-10\"\n              },\n      \"siteIDs\": [64,107,61]\n    }\nFilter by both sites and users on that date range:\n    {\n      \"date\": {\n                 \"from\": \"2020-07-02\",\n                 \"to\": \"2020-09-10\"\n              },\n      \"siteIDs\": [64,107,61],\n      \"userIDs\": [421]\n    }",
          "type": "json"
        }
      ]
    },
    "type": "",
    "url": "",
    "filename": "./routes/v2/retrieve/schedules/liveSchedule.js",
    "groupTitle": "Retrieve_-_Schedule",
    "header": {
      "fields": {
        "Header": [
          {
            "group": "Header",
            "type": "String",
            "optional": false,
            "field": "Authorization",
            "description": "<p>The API Authorization Token. Without this token, no endpoint will be reachable. Value should follow the format &quot;Bearer: MY_TOKEN_HERE&quot;. Please see this example for more information: https://stackoverflow.com/a/22565038.</p>"
          }
        ]
      }
    }
  },
  {
    "version": "1.0.0",
    "name": "RetrieveSchedule",
    "group": "Retrieve_-_Schedule",
    "description": "<p>Retrieves slots with the providers with user data, shift info. Equivalent date slots, are ordered increasingly. Filterable by a date, or date range, with siteIDs and userIDs options. Note all dates must be in YYYY-MM-DD ISO format</p>",
    "parameter": {
      "fields": {
        "Body Parameters": [
          {
            "group": "Body Parameters",
            "type": "dateString|object",
            "optional": false,
            "field": "date",
            "defaultValue": "The current UTC date in 'YYYY-MM-DD' format",
            "description": "<p>A complete date in ISO format: <a href=\"https://www.w3.org/TR/NOTE-datetime\"> Valid Formats</a><br></p> <p>OR <p><u>A date range Object with a &quot;from&quot; and &quot;to&quot; field:</u></p> {</p> <p>&nbsp;&nbsp;&nbsp;\"from\": <b>\"YYYY-MM-DD\"</b></p> <p>&nbsp;&nbsp;&nbsp;\"to\": <b>\"YYYY-MM-DD\"</b> (Must be greater than date.from)</p> }"
          },
          {
            "group": "Body Parameters",
            "type": "integer|integer[]",
            "size": "1-&infin;",
            "optional": true,
            "field": "siteIDs",
            "defaultValue": "All authenticated sites",
            "description": "<p>What sites should the slots be filtered for. Defaults to all available if excluded or empty.</p>"
          },
          {
            "group": "Body Parameters",
            "type": "integer|integer[]",
            "size": "1-&infin;",
            "optional": true,
            "field": "userIDs",
            "defaultValue": "All Users",
            "description": "<p>Filter for specific users (Only those user's slots will be shown).</p>"
          },
          {
            "group": "Body Parameters",
            "type": "boolean",
            "optional": true,
            "field": "includeTradeData",
            "defaultValue": "true",
            "description": "<p>Include Trade data the authenticated user is part of</p>"
          },
          {
            "group": "Body Parameters",
            "type": "integer",
            "size": "1 - &infin;",
            "optional": true,
            "field": "page",
            "defaultValue": "1&#09;&#09;\"Unless&nbsp;turned&nbsp;off&nbsp;in&nbsp;ENVIROMENT&nbsp;VARIABLES\"",
            "description": "<p>What page of data should be loaded.</p>"
          },
          {
            "group": "Body Parameters",
            "type": "integer",
            "size": "10 - 250",
            "optional": true,
            "field": "limit",
            "defaultValue": "10&#09;&#09;\"Unless&nbsp;turned&nbsp;off&nbsp;in&nbsp;ENVIROMENT&nbsp;VARIABLES\"",
            "description": "<p>How many results to return per page.</p>"
          }
        ]
      },
      "examples": [
        {
          "title": "Get slots with providers for a date:",
          "content": "Retrieve slots for January 25th, 2020:\n    {\n      \"date\": \"2020-01-25\"\n    }\nFilter by a UserID on that date:\n    {\n      \"date\": \"2020-04-05\",\n      \"userIDs\": [2417]\n    }\nFilter by a siteIDs on that date:\n    {\n      \"date\": \"2020-04-05\",\n      \"siteIDs\": [184]\n    }\nFilter by both Sites and Users on that date:\n    {\n      \"date\": \"2020-04-05\",\n      \"userIDs\": [2417, 2418],\n      \"siteIDs\":[184,38]\n    }\n(Include page AND limit, site and/or user can be included):\n    {\n      \"date\": \"2020-05-21\",\n      \"page\" : 1,\n      \"limit\": 10\n    }",
          "type": "json"
        },
        {
          "title": "Get slots with providers for a dateRange:",
          "content": "Retrieve slots for the month of January 2020: (Note: This route may be slow for system admins, or for large date ranges.)\n    {\n      \"date\": {\n                 \"from\": \"2020-01-01\",\n                 \"to\": \"2020-01-31\"\n              }\n    }\nFilter by userIDs for a date range:\n    {\n      \"date\": {\n                 \"from\": \"2020-01-25\",\n                 \"to\": \"2020-11-08\"\n              },\n      \"userIDs\": [2417, 2418]\n    }\nFilter by siteIDs for a date range:\n    {\n      \"date\": {\n                 \"from\": \"2020-07-02\",\n                 \"to\": \"2020-09-10\"\n              },\n      \"siteIDs\": [64,107,61]\n    }\nFilter by both sites and users on that date range:\n    {\n      \"date\": {\n                 \"from\": \"2020-07-02\",\n                 \"to\": \"2020-09-10\"\n              },\n      \"siteIDs\": [64,107,61],\n      \"userIDs\": [421]\n    }\n(Include page AND limit):\n    {\n      \"date\": {\n                 \"from\": \"2020-01-25\",\n                 \"to\": \"2020-11-08\"\n              },\n      \"page\" : 1,\n      \"limit\": 10\n    }",
          "type": "json"
        }
      ]
    },
    "type": "",
    "url": "",
    "filename": "./routes/v1/retrieve/schedules/liveSchedule.js",
    "groupTitle": "Retrieve_-_Schedule",
    "header": {
      "fields": {
        "Header": [
          {
            "group": "Header",
            "type": "String",
            "optional": false,
            "field": "Authorization",
            "description": "<p>The API Authorization Token. Without this token, no endpoint will be reachable. Value should follow the format &quot;Bearer: MY_TOKEN_HERE&quot;. Please see this example for more information: https://stackoverflow.com/a/22565038.</p>"
          }
        ]
      }
    }
  },
  {
    "version": "1.0.0",
    "name": "Site_Settings",
    "group": "Retrieve_-_Settings",
    "description": "<p>Usage: Retrieves an array of site Settings corresponding to siteIDs requested</p>",
    "parameter": {
      "fields": {
        "Body Parameters": [
          {
            "group": "Body Parameters",
            "type": "integer[]",
            "size": "1-&infin;",
            "optional": false,
            "field": "siteIDs",
            "description": "<p>Retrieve a settings for one or more siteIDs</p>"
          }
        ]
      },
      "examples": [
        {
          "title": "Get all sites the active User can access:",
          "content": "Retrieve all authenticated sites settings (Empty Body):\n    {\n\n    }\nRetrive site Settings for select sites\n    {\n     \"siteIDs\": [1,2,3]\n    }",
          "type": "json"
        }
      ]
    },
    "success": {
      "fields": {
        "Success 200": [
          {
            "group": "Success 200",
            "type": "object[]",
            "optional": false,
            "field": "data",
            "description": "<p>Array of user objects found.</p>"
          }
        ]
      }
    },
    "type": "",
    "url": "",
    "filename": "./routes/v1/retrieve/settings/post.js",
    "groupTitle": "Retrieve_-_Settings",
    "header": {
      "fields": {
        "Header": [
          {
            "group": "Header",
            "type": "String",
            "optional": false,
            "field": "Authorization",
            "description": "<p>The API Authorization Token. Without this token, no endpoint will be reachable. Value should follow the format &quot;Bearer: MY_TOKEN_HERE&quot;. Please see this example for more information: https://stackoverflow.com/a/22565038.</p>"
          }
        ]
      }
    }
  },
  {
    "version": "1.0.0",
    "name": "User_Settings",
    "group": "Retrieve_-_Settings",
    "description": "<p>Usage: Retrieve an object containing objects of requested user settings.</p>",
    "parameter": {
      "fields": {
        "Body Parameters": [
          {
            "group": "Body Parameters",
            "type": "boolean",
            "optional": true,
            "field": "scheduleSettings",
            "defaultValue": "false",
            "description": "<p>Include user setting for rendering a schedule</p>"
          },
          {
            "group": "Body Parameters",
            "type": "boolean",
            "optional": true,
            "field": "colorSettings",
            "defaultValue": "false",
            "description": "<p>Include user setting for rendering a schedule</p>"
          },
          {
            "group": "Body Parameters",
            "type": "boolean",
            "optional": true,
            "field": "locateSettings",
            "defaultValue": "false",
            "description": "<p>Include user setting for locate view schedule</p>"
          },
          {
            "group": "Body Parameters",
            "type": "boolean",
            "optional": true,
            "field": "applicationSettings",
            "defaultValue": "false",
            "description": "<p>Include user's application settings</p>"
          },
          {
            "group": "Body Parameters",
            "type": "boolean",
            "optional": true,
            "field": "emailSettings",
            "defaultValue": "false",
            "description": "<p>Include user's email settings</p>"
          }
        ]
      },
      "examples": [
        {
          "title": "Retrieve User Setting Object:",
          "content": "Retrieve all user settings (Empty Body):\n    {\n\n    }\nRetrieve only a users color settings\n    {\n     \"colorSettings\":true\n    }\nRetrieve only a users color and locate and email settings\n    {\n     \"colorSettings\":true,\n     \"locateSettings\":true,\n     \"emailSettings\":true\n    }\nRetrieve all user settings (Alternate)\n    {\n     \"scheduleSettings\":true,\n     \"colorSettings\":true,\n     \"locateSettings\":true,\n     \"applicationSettings\":true,\n     \"emailSettings\":true\n    }",
          "type": "json"
        }
      ]
    },
    "success": {
      "fields": {
        "Success 200": [
          {
            "group": "Success 200",
            "type": "object[]",
            "optional": false,
            "field": "data",
            "description": "<p>Array of user objects found.</p>"
          }
        ]
      }
    },
    "type": "",
    "url": "",
    "filename": "./routes/v1/retrieve/settings/post.js",
    "groupTitle": "Retrieve_-_Settings",
    "header": {
      "fields": {
        "Header": [
          {
            "group": "Header",
            "type": "String",
            "optional": false,
            "field": "Authorization",
            "description": "<p>The API Authorization Token. Without this token, no endpoint will be reachable. Value should follow the format &quot;Bearer: MY_TOKEN_HERE&quot;. Please see this example for more information: https://stackoverflow.com/a/22565038.</p>"
          }
        ]
      }
    }
  },
  {
    "version": "1.0.0",
    "name": "Shifts_by_ID",
    "group": "Retrieve_-_Shifts",
    "description": "<p>This method retrieves Shift Records from the database</p>",
    "permission": [
      {
        "name": "Permission to this site in MetricAid's app"
      }
    ],
    "parameter": {
      "fields": {
        "Body Parameters": [
          {
            "group": "Body Parameters",
            "type": "integer[]",
            "size": "1 - &infin;",
            "optional": true,
            "field": "shiftsIDs",
            "description": "<p>one or more shiftIDs to filter for, requires shift to be in your accessible sites.</p>"
          },
          {
            "group": "Body Parameters",
            "type": "integer|integer[]",
            "size": "1 - &infin;",
            "optional": true,
            "field": "siteIDs",
            "defaultValue": "All authenticated",
            "description": "<p>Array of unique siteIDs</p>"
          },
          {
            "group": "Body Parameters",
            "type": "integer",
            "size": "1 - &infin;",
            "optional": true,
            "field": "page",
            "defaultValue": "1&#09;&#09;\"Unless&nbsp;turned&nbsp;off&nbsp;in&nbsp;ENVIROMENT&nbsp;VARIABLES\"",
            "description": "<p>What page of data should be loaded.</p>"
          },
          {
            "group": "Body Parameters",
            "type": "integer",
            "size": "10 - 250",
            "optional": true,
            "field": "limit",
            "defaultValue": "10&#09;&#09;\"Unless&nbsp;turned&nbsp;off&nbsp;in&nbsp;ENVIROMENT&nbsp;VARIABLES\"",
            "description": "<p>How many results to return per page.</p>"
          }
        ]
      },
      "examples": [
        {
          "title": "Get one shift by shift ID:",
          "content": "Retrieve a shift by ID:\n    {\n      \"shiftIDs\": [1536]\n    }\n(Alternative):\n    {\n      \"shiftIDs\": 1536\n    }",
          "type": "json"
        },
        {
          "title": "Get many shifts by shift IDs:",
          "content": "Retrieve many shifts by shiftIDs:\n    {\n      \"shiftIDs\": [1536, 1605, 2274, 1652, 3744, 1618, 1566, 1659, 2266, 1724, 1540, 3575, 2264]\n    }",
          "type": "json"
        },
        {
          "title": "Get many shifts by site ID(s):",
          "content": "Retrieve shifts for a site:\n    {\n      \"siteIDs\": [70]\n    }\nRetrieve shifts for many sites\n    {\n      \"siteIDs\": [70, 120, 80, 31, 81, 16, 101, 82]\n    }\nRetrieve all shifts for all your sites:\n    {\n\n    }",
          "type": "json"
        },
        {
          "title": "Get many shifts by shift and site IDs:",
          "content": "Retrieve many shifts by site IDs filtered by shiftIDs:\n    {\n      \"siteIDs\": [70, 120],\n      \"shiftIDs\": [1536, 2016]\n    }",
          "type": "json"
        }
      ]
    },
    "type": "",
    "url": "",
    "filename": "./routes/v1/retrieve/shifts/post.js",
    "groupTitle": "Retrieve_-_Shifts",
    "header": {
      "fields": {
        "Header": [
          {
            "group": "Header",
            "type": "String",
            "optional": false,
            "field": "Authorization",
            "description": "<p>The API Authorization Token. Without this token, no endpoint will be reachable. Value should follow the format &quot;Bearer: MY_TOKEN_HERE&quot;. Please see this example for more information: https://stackoverflow.com/a/22565038.</p>"
          }
        ]
      }
    }
  },
  {
    "version": "1.0.0",
    "name": "Authenticated_User_Sites",
    "group": "Retrieve_-_Sites",
    "description": "<p>Usage: Retrieves an array of siteIDs representing all the sites this authenticated user has access to</p>",
    "success": {
      "fields": {
        "Success 200": [
          {
            "group": "Success 200",
            "type": "object[]",
            "optional": false,
            "field": "data",
            "description": "<p>Array of user objects found.</p>"
          }
        ]
      }
    },
    "parameter": {
      "examples": [
        {
          "title": "Get all sites the active User can access:",
          "content": "Retrieve all authenticated sites (Empty Body):\n    {\n\n    }",
          "type": "json"
        }
      ]
    },
    "type": "",
    "url": "",
    "filename": "./routes/v1/retrieve/sites/post.js",
    "groupTitle": "Retrieve_-_Sites",
    "header": {
      "fields": {
        "Header": [
          {
            "group": "Header",
            "type": "String",
            "optional": false,
            "field": "Authorization",
            "description": "<p>The API Authorization Token. Without this token, no endpoint will be reachable. Value should follow the format &quot;Bearer: MY_TOKEN_HERE&quot;. Please see this example for more information: https://stackoverflow.com/a/22565038.</p>"
          }
        ]
      }
    }
  },
  {
    "version": "1.0.0",
    "name": "GetTagsForSites",
    "group": "Retrieve_-_Sites",
    "deprecated": true,
    "parameter": {
      "fields": {
        "Body Parameters": [
          {
            "group": "Body Parameters",
            "type": "number[]",
            "optional": false,
            "field": "siteIDs",
            "defaultValue": "'All",
            "description": "<p>Authenticated Sites&quot; What site(s) the tags are associated with</p>"
          },
          {
            "group": "Body Parameters",
            "type": "date",
            "optional": true,
            "field": "effectiveDate",
            "description": "<p>A date to use in checking if the tag is active or expired. Defaults to the current date.</p>"
          },
          {
            "group": "Body Parameters",
            "type": "boolean",
            "optional": true,
            "field": "getDefinitions",
            "description": "<p>Should the site tag definition data be returned as well?</p>"
          },
          {
            "group": "Body Parameters",
            "type": "integer",
            "size": "1 - &infin;",
            "optional": true,
            "field": "page",
            "defaultValue": "1&#09;&#09;\"Unless&nbsp;turned&nbsp;off&nbsp;in&nbsp;ENVIROMENT&nbsp;VARIABLES\"",
            "description": "<p>What page of data should be loaded.</p>"
          },
          {
            "group": "Body Parameters",
            "type": "integer",
            "size": "10 - 250",
            "optional": true,
            "field": "limit",
            "defaultValue": "10&#09;&#09;\"Unless&nbsp;turned&nbsp;off&nbsp;in&nbsp;ENVIROMENT&nbsp;VARIABLES\"",
            "description": "<p>How many results to return per page.</p>"
          }
        ]
      },
      "examples": [
        {
          "title": "Get site tags for one site:",
          "content": "Retrieve a sites Tags (Empty Body):\n    {\n     \"siteIDs\":[70]\n    }",
          "type": "json"
        },
        {
          "title": "Get site tags for many site:",
          "content": "Retrieve many sites Tags:\n    {\n     \"siteIDs\":[70,26]\n    }\n(Include Page and Limit)\n    {\n     \"siteIDs\": [70,26],\n     \"page\": 1,\n     \"limit\": 10\n    }",
          "type": "json"
        },
        {
          "title": "Get site Tags and their definitions:",
          "content": "Retrieve many sites Tags:\n    {\n     \"siteIDs\":[39],\n     \"getDefinitions\": true\n    }\n(Include Page and Limit)\n    {\n     \"siteIDs\":[39],\n     \"getDefinitions\": true\n     \"page\": 1,\n     \"limit\": 10\n    }",
          "type": "json"
        }
      ]
    },
    "success": {
      "fields": {
        "Success 200": [
          {
            "group": "Success 200",
            "type": "object",
            "optional": false,
            "field": "data",
            "description": "<p>The response data container</p>"
          },
          {
            "group": "Success 200",
            "type": "object[]",
            "optional": false,
            "field": "data.tags",
            "description": "<p>the site tag records</p>"
          },
          {
            "group": "Success 200",
            "type": "object[]",
            "optional": true,
            "field": "data.definitions",
            "description": "<p>the related site tag definition records (if requested)</p>"
          }
        ]
      }
    },
    "type": "",
    "url": "",
    "filename": "./routes/v1/retrieve/sites/post.js",
    "groupTitle": "Retrieve_-_Sites",
    "header": {
      "fields": {
        "Header": [
          {
            "group": "Header",
            "type": "String",
            "optional": false,
            "field": "Authorization",
            "description": "<p>The API Authorization Token. Without this token, no endpoint will be reachable. Value should follow the format &quot;Bearer: MY_TOKEN_HERE&quot;. Please see this example for more information: https://stackoverflow.com/a/22565038.</p>"
          }
        ]
      }
    }
  },
  {
    "version": "1.0.0",
    "name": "Site_Roster",
    "description": "<p>Usage: Get rosters for siteIDs. Includes all users who aren't scheduable unless specified. NOTE: Authenticated user making the request will be included.</p>",
    "group": "Retrieve_-_Sites",
    "parameter": {
      "fields": {
        "Body Parameters": [
          {
            "group": "Body Parameters",
            "type": "integer",
            "size": "1-&infin;",
            "optional": false,
            "field": "siteIDs",
            "description": "<p>Retrieve a roster by one or more siteIDs</p>"
          },
          {
            "group": "Body Parameters",
            "type": "boolean",
            "optional": false,
            "field": "scheduledUsers",
            "defaultValue": "false",
            "description": "<p>If true filter for users who are schedulable, or have a schedule</p>"
          }
        ]
      },
      "examples": [
        {
          "title": "Get one sites user roster:",
          "content": "Retrieve a roster by a siteID:\n    {\n      \"siteIDs\": 70\n    }",
          "type": "json"
        },
        {
          "title": "Get many sites user rosters:",
          "content": "Retrieve rosters by siteIDs:\n    {\n      \"siteIDs\": [26,27]\n    }\n(Include Paging and Limit)\n    {\n      \"siteID\": 70,\n      \"page\": 1,\n      \"limit\": 10\n    }",
          "type": "json"
        },
        {
          "title": "Include only scheduable users in site rosters:",
          "content": "Retrieve rosters by siteIDs:\n    {\n      \"siteIDs\": [26,27],\n      \"scheduledUsers\": true\n    }\n(Include Paging and Limit)\n    {\n      \"siteID\": 70,\n      \"scheduledUsers\": true,\n      \"page\": 1,\n      \"limit\": 10\n    }",
          "type": "json"
        }
      ]
    },
    "type": "",
    "url": "",
    "filename": "./routes/v1/retrieve/sites/post.js",
    "groupTitle": "Retrieve_-_Sites",
    "header": {
      "fields": {
        "Header": [
          {
            "group": "Header",
            "type": "String",
            "optional": false,
            "field": "Authorization",
            "description": "<p>The API Authorization Token. Without this token, no endpoint will be reachable. Value should follow the format &quot;Bearer: MY_TOKEN_HERE&quot;. Please see this example for more information: https://stackoverflow.com/a/22565038.</p>"
          }
        ]
      }
    }
  },
  {
    "version": "1.0.0",
    "name": "Sites",
    "group": "Retrieve_-_Sites",
    "description": "<p>Usage: Retrieve Sites filterable by siteIDs the user is authenticated to</p>",
    "parameter": {
      "fields": {
        "Body Parameters": [
          {
            "group": "Body Parameters",
            "type": "number[]",
            "size": "1- &infin",
            "optional": true,
            "field": "siteIDs",
            "defaultValue": "all_available_sites",
            "description": "<p>Filter for specific sites based on their ID.</p>"
          },
          {
            "group": "Body Parameters",
            "type": "boolean",
            "optional": true,
            "field": "onlyActiveSites",
            "defaultValue": "true",
            "description": "<p>If false retrieve sites that are also inactive.</p>"
          },
          {
            "group": "Body Parameters",
            "type": "integer",
            "size": "1 - &infin;",
            "optional": true,
            "field": "page",
            "defaultValue": "1&#09;&#09;\"Unless&nbsp;turned&nbsp;off&nbsp;in&nbsp;ENVIROMENT&nbsp;VARIABLES\"",
            "description": "<p>What page of data should be loaded.</p>"
          },
          {
            "group": "Body Parameters",
            "type": "integer",
            "size": "10 - 250",
            "optional": true,
            "field": "limit",
            "defaultValue": "10&#09;&#09;\"Unless&nbsp;turned&nbsp;off&nbsp;in&nbsp;ENVIROMENT&nbsp;VARIABLES\"",
            "description": "<p>How many results to return per page.</p>"
          }
        ]
      },
      "examples": [
        {
          "title": "Get one site:",
          "content": "Retrieve an authenticated site by siteIDs:\n    {\n      \"siteIDs\": 26\n    }\n(Alternatively)\n    {\n      \"siteIDs\": [26]\n    }",
          "type": "json"
        },
        {
          "title": "Get many sites:",
          "content": "Retrieve many authenticated sites by siteIDs:\n    {\n      \"siteIDs\": [26,27,28,29,30,70,10,13]\n    }",
          "type": "json"
        },
        {
          "title": "Get all sites:",
          "content": "Retrieve all available sites by siteIDs:\n    {\n\n    }\n(Include Inactive Sites)\n    {\n      \"onlyActiveSites\" : false\n    }",
          "type": "json"
        }
      ]
    },
    "type": "",
    "url": "",
    "filename": "./routes/v1/retrieve/sites/post.js",
    "groupTitle": "Retrieve_-_Sites",
    "header": {
      "fields": {
        "Header": [
          {
            "group": "Header",
            "type": "String",
            "optional": false,
            "field": "Authorization",
            "description": "<p>The API Authorization Token. Without this token, no endpoint will be reachable. Value should follow the format &quot;Bearer: MY_TOKEN_HERE&quot;. Please see this example for more information: https://stackoverflow.com/a/22565038.</p>"
          }
        ]
      }
    }
  },
  {
    "version": "1.0.0",
    "name": "RetrieveSlots",
    "group": "Retrieve_-_Slots",
    "description": "<p>Retrieves slots with the providers. Equivalent date slots, are ordered increasingly.</p>",
    "parameter": {
      "fields": {
        "Body Parameters": [
          {
            "group": "Body Parameters",
            "type": "date/object",
            "optional": false,
            "field": "slotIDs",
            "description": "<p>Slots to filter for by ID</p>"
          },
          {
            "group": "Body Parameters",
            "type": "integer",
            "size": "1 - &infin;",
            "optional": true,
            "field": "page",
            "defaultValue": "1&#09;&#09;\"Unless&nbsp;turned&nbsp;off&nbsp;in&nbsp;ENVIROMENT&nbsp;VARIABLES\"",
            "description": "<p>What page of data should be loaded.</p>"
          },
          {
            "group": "Body Parameters",
            "type": "integer",
            "size": "10 - 250",
            "optional": true,
            "field": "limit",
            "defaultValue": "10&#09;&#09;\"Unless&nbsp;turned&nbsp;off&nbsp;in&nbsp;ENVIROMENT&nbsp;VARIABLES\"",
            "description": "<p>How many results to return per page.</p>"
          }
        ]
      },
      "examples": [
        {
          "title": "Get slot(s) with providers by ID(s):",
          "content": "{\n  \"slotIDs\": [1]\n}",
          "type": "json"
        }
      ]
    },
    "type": "",
    "url": "",
    "filename": "./routes/v1/retrieve/slots/post.js",
    "groupTitle": "Retrieve_-_Slots",
    "header": {
      "fields": {
        "Header": [
          {
            "group": "Header",
            "type": "String",
            "optional": false,
            "field": "Authorization",
            "description": "<p>The API Authorization Token. Without this token, no endpoint will be reachable. Value should follow the format &quot;Bearer: MY_TOKEN_HERE&quot;. Please see this example for more information: https://stackoverflow.com/a/22565038.</p>"
          }
        ]
      }
    }
  },
  {
    "version": "1.0.0",
    "name": "RetrieveSiteTags",
    "group": "Retrieve_-_Tags",
    "parameter": {
      "fields": {
        "Body Parameters": [
          {
            "group": "Body Parameters",
            "type": "number[]",
            "optional": true,
            "field": "tagIDs",
            "description": "<p>Filter for specific site tags based on their ID.</p>"
          },
          {
            "group": "Body Parameters",
            "type": "boolean",
            "optional": true,
            "field": "getDefinitions",
            "description": "<p>Should the site tag definition data be returned as well?</p>"
          },
          {
            "group": "Body Parameters",
            "type": "integer",
            "size": "1 - &infin;",
            "optional": true,
            "field": "page",
            "defaultValue": "1&#09;&#09;\"Unless&nbsp;turned&nbsp;off&nbsp;in&nbsp;ENVIROMENT&nbsp;VARIABLES\"",
            "description": "<p>What page of data should be loaded.</p>"
          },
          {
            "group": "Body Parameters",
            "type": "integer",
            "size": "10 - 250",
            "optional": true,
            "field": "limit",
            "defaultValue": "10&#09;&#09;\"Unless&nbsp;turned&nbsp;off&nbsp;in&nbsp;ENVIROMENT&nbsp;VARIABLES\"",
            "description": "<p>How many results to return per page.</p>"
          }
        ]
      }
    },
    "success": {
      "fields": {
        "Success 200": [
          {
            "group": "Success 200",
            "type": "object",
            "optional": false,
            "field": "data",
            "description": "<p>The response data container</p>"
          },
          {
            "group": "Success 200",
            "type": "object[]",
            "optional": false,
            "field": "data.tags",
            "description": "<p>the site tag records</p>"
          },
          {
            "group": "Success 200",
            "type": "object[]",
            "optional": true,
            "field": "data.definitions",
            "description": "<p>the related site tag definition records (if requested)</p>"
          }
        ]
      }
    },
    "type": "",
    "url": "",
    "filename": "./routes/v1/retrieve/tags/site/post.js",
    "groupTitle": "Retrieve_-_Tags",
    "header": {
      "fields": {
        "Header": [
          {
            "group": "Header",
            "type": "String",
            "optional": false,
            "field": "Authorization",
            "description": "<p>The API Authorization Token. Without this token, no endpoint will be reachable. Value should follow the format &quot;Bearer: MY_TOKEN_HERE&quot;. Please see this example for more information: https://stackoverflow.com/a/22565038.</p>"
          }
        ]
      }
    }
  },
  {
    "version": "1.0.0",
    "name": "RetrieveSystemTags",
    "group": "Retrieve_-_Tags",
    "parameter": {
      "fields": {
        "Body Parameters": [
          {
            "group": "Body Parameters",
            "type": "number[]",
            "optional": true,
            "field": "tagIDs",
            "description": "<p>Filter for specific system tags based on their ID.</p>"
          },
          {
            "group": "Body Parameters",
            "type": "boolean",
            "optional": true,
            "field": "getDefinitions",
            "description": "<p>Should the system tag definition data be returned as well?</p>"
          },
          {
            "group": "Body Parameters",
            "type": "integer",
            "size": "1 - &infin;",
            "optional": true,
            "field": "page",
            "defaultValue": "1&#09;&#09;\"Unless&nbsp;turned&nbsp;off&nbsp;in&nbsp;ENVIROMENT&nbsp;VARIABLES\"",
            "description": "<p>What page of data should be loaded.</p>"
          },
          {
            "group": "Body Parameters",
            "type": "integer",
            "size": "10 - 250",
            "optional": true,
            "field": "limit",
            "defaultValue": "10&#09;&#09;\"Unless&nbsp;turned&nbsp;off&nbsp;in&nbsp;ENVIROMENT&nbsp;VARIABLES\"",
            "description": "<p>How many results to return per page.</p>"
          }
        ]
      }
    },
    "success": {
      "fields": {
        "Success 200": [
          {
            "group": "Success 200",
            "type": "object",
            "optional": false,
            "field": "data",
            "description": "<p>The response data container</p>"
          },
          {
            "group": "Success 200",
            "type": "object[]",
            "optional": false,
            "field": "data.tags",
            "description": "<p>the system tag records</p>"
          },
          {
            "group": "Success 200",
            "type": "object[]",
            "optional": true,
            "field": "data.definitions",
            "description": "<p>the related system tag definition records (if requested)</p>"
          },
          {
            "group": "Success 200",
            "type": "object",
            "optional": false,
            "field": "paging",
            "description": "<p>If not all results were returned in this request, this object will have details on how to retrieve the next dataset as well as how many subsequent requests will have to be made.</p>"
          },
          {
            "group": "Success 200",
            "type": "number",
            "optional": false,
            "field": "paging.resultRecordCount",
            "description": "<p>How many records were returned on this page.</p>"
          },
          {
            "group": "Success 200",
            "type": "number",
            "optional": false,
            "field": "paging.totalRecordCount",
            "description": "<p>How many records exist in the database based on the provided search criteria.</p>"
          },
          {
            "group": "Success 200",
            "type": "number",
            "optional": false,
            "field": "paging.currentPage",
            "description": "<p>The page number requested.</p>"
          },
          {
            "group": "Success 200",
            "type": "number",
            "optional": false,
            "field": "paging.pageSize",
            "description": "<p>How many records maximum that a page will return.</p>"
          },
          {
            "group": "Success 200",
            "type": "string",
            "optional": false,
            "field": "paging.nextPageURL",
            "description": "<p>A fully-qualified URL that can be used to request the next page of data. This will be an empty string if there are no more pages to load.</p>"
          },
          {
            "group": "Success 200",
            "type": "string",
            "optional": false,
            "field": "paging.previousPageURL",
            "description": "<p>A fully-qualified URL that can be used to request the previous page of data. This will be an empty string if you are accessing the first page.</p>"
          },
          {
            "group": "Success 200",
            "type": "object",
            "optional": false,
            "field": "status",
            "description": "<p>Details about the result.</p>"
          },
          {
            "group": "Success 200",
            "type": "string",
            "optional": false,
            "field": "status.code",
            "description": "<p>See status codes for more info.</p>"
          },
          {
            "group": "Success 200",
            "type": "string",
            "optional": false,
            "field": "status.message",
            "description": "<p>See status codes for more info.</p>"
          },
          {
            "group": "Success 200",
            "type": "date",
            "optional": false,
            "field": "executedAt",
            "description": "<p>When the request was received.</p>"
          },
          {
            "group": "Success 200",
            "type": "number",
            "optional": false,
            "field": "timeElapsed",
            "description": "<p>How long (in milliseconds) did the request take the server to process.</p>"
          },
          {
            "group": "Success 200",
            "type": "boolean",
            "optional": false,
            "field": "error",
            "description": "<p>Check this value first when attempting to decide whether the response was a success or not, then check the status.code and status.message fields.</p>"
          }
        ]
      }
    },
    "type": "",
    "url": "",
    "filename": "./routes/v1/retrieve/tags/system/post.js",
    "groupTitle": "Retrieve_-_Tags",
    "header": {
      "fields": {
        "Header": [
          {
            "group": "Header",
            "type": "String",
            "optional": false,
            "field": "Authorization",
            "description": "<p>The API Authorization Token. Without this token, no endpoint will be reachable. Value should follow the format &quot;Bearer: MY_TOKEN_HERE&quot;. Please see this example for more information: https://stackoverflow.com/a/22565038.</p>"
          }
        ]
      }
    }
  },
  {
    "version": "1.0.0",
    "name": "RetrieveDirectTrades",
    "group": "Retrieve_-_Trades",
    "description": "<p>Retrieve a direct trade with the nested providers users for both source and target</p>",
    "parameter": {
      "fields": {
        "Body Parameters": [
          {
            "group": "Body Parameters",
            "type": "integer",
            "optional": false,
            "field": "directTradeID",
            "description": "<p>The ID for the Direct Trade being requested.</p>"
          },
          {
            "group": "Body Parameters",
            "type": "integer",
            "size": "1 - &infin;",
            "optional": true,
            "field": "page",
            "defaultValue": "1&#09;&#09;\"Unless&nbsp;turned&nbsp;off&nbsp;in&nbsp;ENVIROMENT&nbsp;VARIABLES\"",
            "description": "<p>What page of data should be loaded.</p>"
          },
          {
            "group": "Body Parameters",
            "type": "integer",
            "size": "10 - 250",
            "optional": true,
            "field": "limit",
            "defaultValue": "10&#09;&#09;\"Unless&nbsp;turned&nbsp;off&nbsp;in&nbsp;ENVIROMENT&nbsp;VARIABLES\"",
            "description": "<p>How many results to return per page.</p>"
          }
        ]
      },
      "examples": [
        {
          "title": "Grab the direct trade and all related data with id 1",
          "content": "{\n  \"directTradeID\": 1\n}",
          "type": "json"
        }
      ]
    },
    "type": "",
    "url": "",
    "filename": "./routes/v1/retrieve/trades/post.js",
    "groupTitle": "Retrieve_-_Trades",
    "header": {
      "fields": {
        "Header": [
          {
            "group": "Header",
            "type": "String",
            "optional": false,
            "field": "Authorization",
            "description": "<p>The API Authorization Token. Without this token, no endpoint will be reachable. Value should follow the format &quot;Bearer: MY_TOKEN_HERE&quot;. Please see this example for more information: https://stackoverflow.com/a/22565038.</p>"
          }
        ]
      }
    }
  },
  {
    "version": "1.0.0",
    "name": "RetrieveMarketplaceTrades",
    "group": "Retrieve_-_Trades",
    "description": "<p>Retrieve all trades an authenticated user can respond to.</p>",
    "parameter": {
      "fields": {
        "Body Parameters": [
          {
            "group": "Body Parameters",
            "type": "integer|integer[]",
            "size": "1-&infin;",
            "optional": true,
            "field": "siteIDs",
            "defaultValue": "All authenticated sites",
            "description": "<p>What sites should the slots be filtered for. Defaults to all available if excluded or empty.</p>"
          },
          {
            "group": "Body Parameters",
            "type": "boolean",
            "optional": true,
            "field": "computeOverlaps",
            "defaultValue": "true",
            "description": "<p>Compute overlapping slots on each trade. Decreases performance, obviously.</p>"
          },
          {
            "group": "Body Parameters",
            "type": "integer",
            "size": "1 - &infin;",
            "optional": true,
            "field": "page",
            "defaultValue": "1&#09;&#09;\"Unless&nbsp;turned&nbsp;off&nbsp;in&nbsp;ENVIROMENT&nbsp;VARIABLES\"",
            "description": "<p>What page of data should be loaded.</p>"
          },
          {
            "group": "Body Parameters",
            "type": "integer",
            "size": "10 - 250",
            "optional": true,
            "field": "limit",
            "defaultValue": "10&#09;&#09;\"Unless&nbsp;turned&nbsp;off&nbsp;in&nbsp;ENVIROMENT&nbsp;VARIABLES\"",
            "description": "<p>How many results to return per page.</p>"
          }
        ]
      },
      "examples": [
        {
          "title": "Get all marketplace direct trade related data:",
          "content": "Get all marketplace trade data:\n    {\n\n    }\nGet all marketplace trade data:\n    {\n      \"siteIDs\": [2417,23,70,77]\n    }",
          "type": "json"
        }
      ]
    },
    "success": {
      "fields": {
        "Success 200": [
          {
            "group": "Success 200",
            "type": "Array",
            "optional": false,
            "field": "data",
            "description": "<p>An array of objects. (Direct, and Trade Postings may be interweived by date. Use the trade type to determine log to run on data)</p>"
          },
          {
            "group": "Success 200",
            "type": "DirectTradeObject",
            "optional": true,
            "field": "data.Trade",
            "description": "<p>An object with either direct trade, or trade posting data.</p>"
          },
          {
            "group": "Success 200",
            "type": "Integer[]",
            "optional": false,
            "field": "data.Trade.type",
            "description": "<p>A value indicating the trade type:<br> 0: Giveaway<br> 1: Trade<br> 2: Trade/Giveaway<br> 3: Direct Trade</p>"
          },
          {
            "group": "Success 200",
            "type": "Boolean|null",
            "optional": false,
            "field": "data.Trade.overlap",
            "description": "<p>Null, if overlaps weren't computed, otherwise a Boolean indicating whether any future slots being worked overlaps this shift.</p>"
          },
          {
            "group": "Success 200",
            "type": "Integer[]|null",
            "optional": false,
            "field": "data.Trade.overlapSlotIDs",
            "description": "<p>An array of slotIDs that overlap this trade offer.</p>"
          }
        ]
      }
    },
    "type": "",
    "url": "",
    "filename": "./routes/v1/retrieve/trades/tradeMarketplace.js",
    "groupTitle": "Retrieve_-_Trades",
    "header": {
      "fields": {
        "Header": [
          {
            "group": "Header",
            "type": "String",
            "optional": false,
            "field": "Authorization",
            "description": "<p>The API Authorization Token. Without this token, no endpoint will be reachable. Value should follow the format &quot;Bearer: MY_TOKEN_HERE&quot;. Please see this example for more information: https://stackoverflow.com/a/22565038.</p>"
          }
        ]
      }
    }
  },
  {
    "version": "1.0.0",
    "name": "RetrieveMyTrades",
    "group": "Retrieve_-_Trades",
    "description": "<p>Retrieve all trades this user has posted.</p>",
    "parameter": {
      "fields": {
        "Body Parameters": [
          {
            "group": "Body Parameters",
            "type": "integer|integer[]",
            "size": "1-&infin;",
            "optional": true,
            "field": "siteIDs",
            "defaultValue": "All authenticated sites",
            "description": "<p>What sites should the slots be filtered for. Defaults to all available if excluded or empty.</p>"
          },
          {
            "group": "Body Parameters",
            "type": "integer",
            "size": "1 - &infin;",
            "optional": true,
            "field": "page",
            "defaultValue": "1&#09;&#09;\"Unless&nbsp;turned&nbsp;off&nbsp;in&nbsp;ENVIROMENT&nbsp;VARIABLES\"",
            "description": "<p>What page of data should be loaded.</p>"
          },
          {
            "group": "Body Parameters",
            "type": "integer",
            "size": "10 - 250",
            "optional": true,
            "field": "limit",
            "defaultValue": "10&#09;&#09;\"Unless&nbsp;turned&nbsp;off&nbsp;in&nbsp;ENVIROMENT&nbsp;VARIABLES\"",
            "description": "<p>How many results to return per page.</p>"
          }
        ]
      },
      "examples": [
        {
          "title": "Get all trades this user posted.",
          "content": "{\n\n}",
          "type": "json"
        }
      ]
    },
    "type": "",
    "url": "",
    "filename": "./routes/v1/retrieve/trades/myTrades.js",
    "groupTitle": "Retrieve_-_Trades",
    "header": {
      "fields": {
        "Header": [
          {
            "group": "Header",
            "type": "String",
            "optional": false,
            "field": "Authorization",
            "description": "<p>The API Authorization Token. Without this token, no endpoint will be reachable. Value should follow the format &quot;Bearer: MY_TOKEN_HERE&quot;. Please see this example for more information: https://stackoverflow.com/a/22565038.</p>"
          }
        ]
      }
    }
  },
  {
    "version": "1.0.0",
    "name": "RetrieveTradePosting",
    "group": "Retrieve_-_Trades",
    "description": "<p>Retrieve a posting with nested responses, acknowledgements and approvals</p>",
    "parameter": {
      "fields": {
        "Body Parameters": [
          {
            "group": "Body Parameters",
            "type": "integer",
            "optional": false,
            "field": "tradePostingID",
            "description": "<p>The ID for the trade posting being requested.</p>"
          },
          {
            "group": "Body Parameters",
            "type": "integer",
            "size": "1 - &infin;",
            "optional": true,
            "field": "page",
            "defaultValue": "1&#09;&#09;\"Unless&nbsp;turned&nbsp;off&nbsp;in&nbsp;ENVIROMENT&nbsp;VARIABLES\"",
            "description": "<p>What page of data should be loaded.</p>"
          },
          {
            "group": "Body Parameters",
            "type": "integer",
            "size": "10 - 250",
            "optional": true,
            "field": "limit",
            "defaultValue": "10&#09;&#09;\"Unless&nbsp;turned&nbsp;off&nbsp;in&nbsp;ENVIROMENT&nbsp;VARIABLES\"",
            "description": "<p>How many results to return per page.</p>"
          }
        ]
      },
      "examples": [
        {
          "title": "Grab the trade posting and all related data with id 1",
          "content": "{\n  \"tradePostingID\": 1\n}",
          "type": "json"
        }
      ]
    },
    "type": "",
    "url": "",
    "filename": "./routes/v1/retrieve/trades/post.js",
    "groupTitle": "Retrieve_-_Trades",
    "header": {
      "fields": {
        "Header": [
          {
            "group": "Header",
            "type": "String",
            "optional": false,
            "field": "Authorization",
            "description": "<p>The API Authorization Token. Without this token, no endpoint will be reachable. Value should follow the format &quot;Bearer: MY_TOKEN_HERE&quot;. Please see this example for more information: https://stackoverflow.com/a/22565038.</p>"
          }
        ]
      }
    }
  },
  {
    "version": "1.0.0",
    "name": "RetrieveTradeableSlotProviders",
    "group": "Retrieve_-_Trades",
    "description": "<p>Retrieve all the slot providers a sourceUser can offer in a trade that a targetUser can accept or decline.</p>",
    "parameter": {
      "fields": {
        "Body Parameters": [
          {
            "group": "Body Parameters",
            "type": "integer",
            "optional": false,
            "field": "sourceUserID",
            "description": "<p>User ID who is offering a slot to be accepted by the targetted user</p>"
          },
          {
            "group": "Body Parameters",
            "type": "integer",
            "optional": false,
            "field": "targetUserID",
            "description": "<p>User who will be accepting or declined the offered slot.</p>"
          },
          {
            "group": "Body Parameters",
            "type": "boolean",
            "optional": true,
            "field": "excludeDirectTrades",
            "defaultValue": "false",
            "description": "<p>Only get slot providers you can use as creating a direct trade to somebody</p>"
          },
          {
            "group": "Body Parameters",
            "type": "integer",
            "size": "1 - &infin;",
            "optional": true,
            "field": "page",
            "defaultValue": "1&#09;&#09;\"Unless&nbsp;turned&nbsp;off&nbsp;in&nbsp;ENVIROMENT&nbsp;VARIABLES\"",
            "description": "<p>What page of data should be loaded.</p>"
          },
          {
            "group": "Body Parameters",
            "type": "integer",
            "size": "10 - 250",
            "optional": true,
            "field": "limit",
            "defaultValue": "10&#09;&#09;\"Unless&nbsp;turned&nbsp;off&nbsp;in&nbsp;ENVIROMENT&nbsp;VARIABLES\"",
            "description": "<p>How many results to return per page.</p>"
          }
        ]
      },
      "examples": [
        {
          "title": "Grab slots that user 421 and offer to user 174 to accept",
          "content": "{\n  \"sourceUserID\": 421,\n  \"targetUserID\": 174\n}",
          "type": "json"
        },
        {
          "title": "Include any direct user 421 has made on the returned slots",
          "content": "{\n  \"sourceUserID\": 421,\n  \"targetUserID\": 174,\n  \"excludeDirectTrades\": true\n}",
          "type": "json"
        }
      ]
    },
    "type": "",
    "url": "",
    "filename": "./routes/v1/retrieve/trades/tradeableSlots.js",
    "groupTitle": "Retrieve_-_Trades",
    "header": {
      "fields": {
        "Header": [
          {
            "group": "Header",
            "type": "String",
            "optional": false,
            "field": "Authorization",
            "description": "<p>The API Authorization Token. Without this token, no endpoint will be reachable. Value should follow the format &quot;Bearer: MY_TOKEN_HERE&quot;. Please see this example for more information: https://stackoverflow.com/a/22565038.</p>"
          }
        ]
      }
    }
  },
  {
    "version": "1.0.0",
    "name": "RetrieveUserRoster",
    "group": "Retrieve_-_Users",
    "description": "<p>Retrieve all other users this authenticated user can view or interact with.</p>",
    "parameter": {
      "fields": {
        "Body Parameters": [
          {
            "group": "Body Parameters",
            "type": "integer|integer[]",
            "size": "1-&infin;",
            "optional": true,
            "field": "siteIDs",
            "defaultValue": "All authenticated sites",
            "description": "<p>What sites should the slots be filtered for. Defaults to all available if excluded or empty.</p>"
          },
          {
            "group": "Body Parameters",
            "type": "boolean",
            "optional": true,
            "field": "scheduableUsers",
            "defaultValue": "true",
            "description": "<p>Only grab users who can work shifts on the schedule.</p>"
          },
          {
            "group": "Body Parameters",
            "type": "integer",
            "size": "1 - &infin;",
            "optional": true,
            "field": "page",
            "defaultValue": "1&#09;&#09;\"Unless&nbsp;turned&nbsp;off&nbsp;in&nbsp;ENVIROMENT&nbsp;VARIABLES\"",
            "description": "<p>What page of data should be loaded.</p>"
          },
          {
            "group": "Body Parameters",
            "type": "integer",
            "size": "10 - 250",
            "optional": true,
            "field": "limit",
            "defaultValue": "10&#09;&#09;\"Unless&nbsp;turned&nbsp;off&nbsp;in&nbsp;ENVIROMENT&nbsp;VARIABLES\"",
            "description": "<p>How many results to return per page.</p>"
          }
        ]
      },
      "examples": [
        {
          "title": "User Rosters:",
          "content": "All Users for all authenticated sites:\n    {\n\n    }",
          "type": "json"
        }
      ]
    },
    "type": "",
    "url": "",
    "filename": "./routes/v1/retrieve/users/userRosters.js",
    "groupTitle": "Retrieve_-_Users",
    "header": {
      "fields": {
        "Header": [
          {
            "group": "Header",
            "type": "String",
            "optional": false,
            "field": "Authorization",
            "description": "<p>The API Authorization Token. Without this token, no endpoint will be reachable. Value should follow the format &quot;Bearer: MY_TOKEN_HERE&quot;. Please see this example for more information: https://stackoverflow.com/a/22565038.</p>"
          }
        ]
      }
    }
  },
  {
    "version": "1.0.0",
    "name": "RetrieveUserTradeList",
    "group": "Retrieve_-_Users",
    "description": "<p>Retrieve all other users this authenticated user can offer a slot to.</p>",
    "parameter": {
      "fields": {
        "Body Parameters": [
          {
            "group": "Body Parameters",
            "type": "integer",
            "size": "1-&infin;",
            "optional": false,
            "field": "slot_provider_id",
            "description": "<p>The slot_provider_id being offered.</p>"
          },
          {
            "group": "Body Parameters",
            "type": "integer",
            "size": "1 - &infin;",
            "optional": true,
            "field": "page",
            "defaultValue": "1&#09;&#09;\"Unless&nbsp;turned&nbsp;off&nbsp;in&nbsp;ENVIROMENT&nbsp;VARIABLES\"",
            "description": "<p>What page of data should be loaded.</p>"
          },
          {
            "group": "Body Parameters",
            "type": "integer",
            "size": "10 - 250",
            "optional": true,
            "field": "limit",
            "defaultValue": "10&#09;&#09;\"Unless&nbsp;turned&nbsp;off&nbsp;in&nbsp;ENVIROMENT&nbsp;VARIABLES\"",
            "description": "<p>How many results to return per page.</p>"
          }
        ]
      },
      "examples": [
        {
          "title": "User Rosters:",
          "content": "All Users for all authenticated sites:\n    {\n      slot_provider_id:\n    }",
          "type": "json"
        }
      ]
    },
    "type": "",
    "url": "",
    "filename": "./routes/v1/retrieve/users/tradeList.js",
    "groupTitle": "Retrieve_-_Users",
    "header": {
      "fields": {
        "Header": [
          {
            "group": "Header",
            "type": "String",
            "optional": false,
            "field": "Authorization",
            "description": "<p>The API Authorization Token. Without this token, no endpoint will be reachable. Value should follow the format &quot;Bearer: MY_TOKEN_HERE&quot;. Please see this example for more information: https://stackoverflow.com/a/22565038.</p>"
          }
        ]
      }
    }
  },
  {
    "version": "1.0.0",
    "name": "RetrieveUsers",
    "group": "Retrieve_-_Users",
    "description": "<p>This is a description that needs to change</p>",
    "parameter": {
      "fields": {
        "Body Parameters": [
          {
            "group": "Body Parameters",
            "type": "number[]",
            "size": "1- &infin",
            "optional": true,
            "field": "userIDs",
            "description": "<p>Filter for specific users based on their ID.</p>"
          },
          {
            "group": "Body Parameters",
            "type": "integer",
            "size": "1 - &infin;",
            "optional": true,
            "field": "page",
            "defaultValue": "1&#09;&#09;\"Unless&nbsp;turned&nbsp;off&nbsp;in&nbsp;ENVIROMENT&nbsp;VARIABLES\"",
            "description": "<p>What page of data should be loaded.</p>"
          },
          {
            "group": "Body Parameters",
            "type": "integer",
            "size": "10 - 250",
            "optional": true,
            "field": "limit",
            "defaultValue": "10&#09;&#09;\"Unless&nbsp;turned&nbsp;off&nbsp;in&nbsp;ENVIROMENT&nbsp;VARIABLES\"",
            "description": "<p>How many results to return per page.</p>"
          }
        ]
      },
      "examples": [
        {
          "title": "Get one user by ID:",
          "content": "Retrieve a shift by ID:\n    {\n      \"userIDs\": [1536]\n    }\n(Alternative):\n    {\n      \"userIDs\": 1536\n    }",
          "type": "json"
        },
        {
          "title": "Get many users by ID:",
          "content": "Retrieve many shifts:\n    {\n      \"userIDs\": [1536, 1605, 2274, 1652, 3744, 1618, 1566, 1659, 2266, 1724, 1540, 3575, 2264]\n    }\n(Include page AND limit):\n    {\n      \"userIDs\": [1536, 1605, 2274, 1652, 3744, 1618, 1566, 1659, 2266, 1724, 1540, 3575, 2264],\n      \"page\" : 1,\n      \"limit\": 10\n    }",
          "type": "json"
        },
        {
          "title": "Get many users by a site ID:",
          "content": "Retrieve many shifts:\n    {\n      \"siteID\": 70\n    }\n(Alternative):\n    {\n      \"siteID\": [70]\n    }\n(Include page AND limit):\n    {\n      \"siteID\": 70,\n      \"page\" : 1,\n      \"limit\": 10\n    }",
          "type": "json"
        }
      ]
    },
    "success": {
      "fields": {
        "Success 200": [
          {
            "group": "Success 200",
            "type": "object[]",
            "optional": false,
            "field": "data",
            "description": "<p>Array of user objects found.</p>"
          }
        ]
      }
    },
    "type": "",
    "url": "",
    "filename": "./routes/v1/retrieve/users/post.js",
    "groupTitle": "Retrieve_-_Users",
    "header": {
      "fields": {
        "Header": [
          {
            "group": "Header",
            "type": "String",
            "optional": false,
            "field": "Authorization",
            "description": "<p>The API Authorization Token. Without this token, no endpoint will be reachable. Value should follow the format &quot;Bearer: MY_TOKEN_HERE&quot;. Please see this example for more information: https://stackoverflow.com/a/22565038.</p>"
          }
        ]
      }
    }
  },
  {
    "type": "get",
    "url": "/public/schedule",
    "title": "Get Schedule Data",
    "version": "1.0.0",
    "name": "GetSchedules",
    "group": "Schedules",
    "description": "<p>Retreive schedule data between a date range for each token</p>",
    "examples": [
      {
        "title": "Monthly Live Data",
        "content": "https://api.metricaid.com/public/schedule?token={token}&startDate=2021-01-01&endDate=2021-02-01",
        "type": "json"
      },
      {
        "title": "(alternative) Monthly Live Data",
        "content": "https://api.metricaid.com/public/schedule?token={token}&startDate=2021-01-01&endDate=2021-02-01&scheduleVersion=live",
        "type": "json"
      },
      {
        "title": "Current Data",
        "content": "https://api.metricaid.com/public/schedule?token={token}&current=true",
        "type": "json"
      },
      {
        "title": "Weekly live data multiple sites",
        "content": "https://api.metricaid.com/public/schedule?token={token1},{token2...}&startDate=2021-01-01&endDate=2021-01-08&scheduleVersion=live",
        "type": "json"
      },
      {
        "title": "Monthly Draft Data",
        "content": "https://api.metricaid.com/public/schedule?token={token}&startDate=2021-01-01&endDate=2021-02-01&scheduleVersion=draft",
        "type": "json"
      },
      {
        "title": "Monthly Working Data",
        "content": "https://api.metricaid.com/public/schedule?token={token}&startDate=2021-01-01&endDate=2021-02-01&scheduleVersion=working",
        "type": "json"
      },
      {
        "title": "Filter by Tags",
        "content": "https://api.metricaid.com/public/schedule?token={token}&startDate=2021-01-01&endDate=2021-02-01&scheduleVersion=draft&tags=Physician,Admin",
        "type": "json"
      },
      {
        "title": "Filter by Tags",
        "content": "https://api.metricaid.com/public/schedule?token={token}&startDate=2021-01-01&endDate=2021-02-01&scheduleVersion=draft&shifts=Night,On%20Call",
        "type": "json"
      },
      {
        "title": "Filter by Users IDs",
        "content": "https://api.metricaid.com/public/schedule?token={token}&startDate=2021-01-01&endDate=2021-02-01&scheduleVersion=draft&userIDs=1,2,3",
        "type": "json"
      }
    ],
    "parameter": {
      "fields": {
        "Query Parameters": [
          {
            "group": "Query Parameters",
            "type": "String",
            "optional": false,
            "field": "token",
            "description": "<p>String - Token representing the site to access data for, or a comma delimited list of tokens for many sites.<br> ex) .../schedule?token=aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa<br>ex) .../schedule?token=aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa,bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb</p>"
          },
          {
            "group": "Query Parameters",
            "type": "String",
            "optional": false,
            "field": "current",
            "description": "<p>boolean - If true, returns all shifts that are currently occuring (start_time &lt; now &amp;&amp; end_time &gt; now). <br><b>NOTE: Can not be used with 'startDate' or 'endDate'</b></p>"
          },
          {
            "group": "Query Parameters",
            "type": "String",
            "optional": false,
            "field": "startDate",
            "description": "<p>String - YYYY-MM-DD Format, all shifts that start after or on this day will be included. <br><b>NOTE: Can not be used with 'current'</b></p>"
          },
          {
            "group": "Query Parameters",
            "type": "String",
            "optional": false,
            "field": "endDate",
            "description": "<p>String - YYYY-MM-DD Format, all shifts that start before or on this day will be included. <br><b>NOTE: Can not be used with 'current'</b></p>"
          },
          {
            "group": "Query Parameters",
            "type": "String",
            "optional": true,
            "field": "scheduleVersion",
            "defaultValue": "live",
            "description": "<p>String - (live, working, or draft) The type of shifts to return.<br> - live: Live Schedule data that physicians have worked, or are scheduled to work.<br> - draft: Drafted Schedule Data that is subject to change. <br> - working: Schedule data that is currently being built in the builder.</p>"
          },
          {
            "group": "Query Parameters",
            "type": "String",
            "optional": true,
            "field": "tags",
            "defaultValue": "any",
            "description": "<p>String - Comma seperated list of Tag names (case sensitive). Schedule data with users working a shift who have at least 1 of these tags will be returned.<br><b>NOTE: Can not be used with 'userIDs'</b></p>"
          },
          {
            "group": "Query Parameters",
            "type": "String",
            "optional": true,
            "field": "shifts",
            "defaultValue": "any",
            "description": "<p>String - Comma seperated list of Shift names (case sensitive). Schedule data with Shifts matching these names will be returned.</p>"
          },
          {
            "group": "Query Parameters",
            "type": "String",
            "optional": true,
            "field": "userIDs",
            "defaultValue": "any",
            "description": "<p>String - Comma sperated list of user ids. Schedule data where only these users are working will be returned.<br><b>NOTE: Can not be used with 'tags'</b></p>"
          }
        ]
      }
    },
    "success": {
      "fields": {
        "Successful Request Structure": [
          {
            "group": "Successful Request Structure",
            "type": "Object",
            "optional": false,
            "field": "data",
            "description": "<p>array of objects with the data requested see below for an example</p>"
          },
          {
            "group": "Successful Request Structure",
            "type": "Object",
            "optional": false,
            "field": "paging",
            "description": "<p>we dont have paging or limits yet... (maybe never, dont abuse the system and we won't add it)</p>"
          },
          {
            "group": "Successful Request Structure",
            "type": "Object",
            "optional": false,
            "field": "status",
            "description": "<p>object containing error (or success) information</p>"
          },
          {
            "group": "Successful Request Structure",
            "type": "Object",
            "optional": false,
            "field": "executedAt",
            "description": "<p>when this request started</p>"
          },
          {
            "group": "Successful Request Structure",
            "type": "Object",
            "optional": false,
            "field": "timeElapsed",
            "description": "<p>time until a response was sent from the api</p>"
          },
          {
            "group": "Successful Request Structure",
            "type": "Object",
            "optional": false,
            "field": "error",
            "description": "<p>a boolean, will be true for success, <b>but you should always check this first after every request<b></p>"
          }
        ]
      },
      "examples": [
        {
          "title": "Success Example:",
          "content": "HTTP/1.1 200 OK\n  {\n     \"data\": [\n         {\n             \"slot_id\": 0,                           // unique id for this person working this shift at this time on this day\n             \"date\": \"2021-08-02\",                   // the date this shift starts\n             \"is_on_call\": false,                    // is this an on-call shift\n             \"start_time\": \"2021-08-02 08:00:00\",    // what time with respect to the timezone this site is in, does this shift start\n             \"end_time\": \"2021-08-02 21:00:00\",      // what time with respect to the timezone this site is in, does this shift end\n             \"is_weekend\": false,                    // is this a weekend shift\n             \"index\": 0,                             // multiple people can work a shift, index 0 mean we display this user at above an index 1 and so on...\n             \"shift\": {                              // object containing more details about the shift\n                 \"id\": 0,                            // unique id for this shift\n                 \"name\": \"8am-9pm\",                  // name for the shift\n                 \"alias\": \"FullDay\",                 // alias used by physicians at the site for this shift\n                 \"color\": \"#a8ffab\"                  // the colour we use to represent this shift in tool\n             },\n             \"user\": {                               // user object containing more details about the user working this shift.\n                 \"id\": 0,                            // unique id for the user\n                 \"fname\": \"FirstName\",               // users first name\n                 \"mname\": \"MiddleName\",              // users middle name\n                 \"lname\": \"LastName\"                 // users last name\n             },\n             \"site\": {                               // object containing details about the site for the token passed\n                 \"id\": 0,                            // unique id for this site\n                 \"name\": \"MetricAid API Test Site\",  // name of the site\n                 \"short_name\": \"MATS\",               // short (abbreviated) name for the site\n                 \"timezone\": {                       // site timezone object\n                     \"id\": 267,                      // a unique id for the timezone this site is in\n                     \"name\": \"America/Toronto\"       // timezone abbreviation, can tell us what UTC offset this site has.\n                 }\n             }\n         },\n         {\n             .... // Potentially more object as above with different data. Check data.length to know how many records were retrieved.\n         }\n     ],\n     \"paging\": null,                         // no paging yet...\n     \"status\": {\n         \"code\": \"General.Success\",          // the status code is General.Success (That means in general it was successful)\n         \"message\": \"Success\"                // if there was an error this message will get you a better clue of what went wrong\n     },\n     \"executedAt\": \"2021-08-24T21:25:36.670Z\",   // time the request was received\n     \"timeElapsed\": 82,                      // time from request reeived to a response sent\n     \"error\": false                          // no error so its false, always check this on every response retrieved.\n }",
          "type": "json"
        }
      ]
    },
    "error": {
      "fields": {
        "Error Codes": [
          {
            "group": "Error Codes",
            "type": "Object",
            "optional": false,
            "field": "status",
            "description": "<p>Object containing error information</p>"
          },
          {
            "group": "Error Codes",
            "type": "String",
            "optional": false,
            "field": "status.code",
            "description": "<p>status.code - String containing the error code we represent internally. See below for a list of possible errors</p>"
          },
          {
            "group": "Error Codes",
            "type": "String",
            "optional": false,
            "field": "status.code.Parameter_Error_Parsing",
            "description": "<ul> <li>parameter.error.parsing - Failed to parse a query param from the request. See status.message for more details.</li> </ul>"
          },
          {
            "group": "Error Codes",
            "type": "String",
            "optional": false,
            "field": "status.code.URI_Malformed",
            "description": "<ul> <li>URI.Malformed - The URI you requested is malforned. Check above examples and make sure you dont have uneccesary or non uni-code characters in the URI.</li> </ul>"
          },
          {
            "group": "Error Codes",
            "type": "String",
            "optional": false,
            "field": "status.code.General_Error",
            "description": "<ul> <li>general.error - Something went wrong internally. Feel free to report this to our client service team.</li> </ul>"
          },
          {
            "group": "Error Codes",
            "type": "String",
            "optional": false,
            "field": "status.code.Database_Error_Querying",
            "description": "<ul> <li>database.error.querying - Something went wrong internally. Feel free to report this to our client service team.</li> </ul>"
          },
          {
            "group": "Error Codes",
            "type": "String",
            "optional": false,
            "field": "status.message",
            "description": "<p>status.message - String containing additional information about what error occured.</p>"
          }
        ]
      },
      "examples": [
        {
          "title": "Example Error Response with comments explaining how to break down the response:",
          "content": "HTTP/1.1 404 Not Found\n{\n    \"data\": {}, // No data to return\n    \"paging\": null, // we dont have pagination required just yet\n    \"status\": {\n        \"code\": \"Parameter.Error.Parsing\", // from this we know a parameter was passed incorrectly.\n        \"message\": \"API access token {aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaa} has an invalid format.\\n\" // We used a bad api token, aaa.... is obviously an invalid token\n    },\n    \"executedAt\": \"2021-08-24T21:17:51.996Z\", // when the request started\n    \"timeElapsed\": 29, // time in ms till a response was sent\n    \"error\": true  // a boolean that can be checked programatically after every request, if true then something went wrong and you need to react to it.\n}",
          "type": "json"
        }
      ]
    },
    "filename": "./routes/public/schedules/get.js",
    "groupTitle": "Schedules"
  },
  {
    "version": "1.0.0",
    "name": "TestStuff",
    "group": "Test_Code",
    "description": "<p>Test the code in the playground</p>",
    "type": "",
    "url": "",
    "filename": "./routes/test/index.js",
    "groupTitle": "Test_Code"
  },
  {
    "version": "1.0.0",
    "name": "Add/Update_or_remove_this_users_association_to_this_device_for_push_notifications",
    "group": "Update_-_PushNotifications",
    "description": "<p>Create/Update or Remove an aws endpoint subscription for this user and device in AWS console.</p>",
    "parameter": {
      "fields": {
        "Body Parameters": [
          {
            "group": "Body Parameters",
            "type": "boolean",
            "optional": true,
            "field": "unsubscribe",
            "defaultValue": "false",
            "description": "<p>True/False Set this true if the user should no longer receive push notifications for this device, or is logging out.</p>"
          },
          {
            "group": "Body Parameters",
            "type": "string",
            "optional": false,
            "field": "token",
            "description": "<p>The device token we are subscribing or unsubscribing for</p>"
          },
          {
            "group": "Body Parameters",
            "type": "string",
            "optional": false,
            "field": "os",
            "description": "<p>The operating system of this device, one of 'Android' or 'IOS'.</p>"
          },
          {
            "group": "Body Parameters",
            "type": "string",
            "optional": false,
            "field": "device_id",
            "description": "<p>An immutable id that uniquely identifies the device whos subscription is being updated.</p>"
          }
        ]
      },
      "examples": [
        {
          "title": "Associate this user with this device as an endpoint for push notifications in AWS",
          "content": "Enable push notifications for this android device for this user\n {\n     \"token\":\"45n4jgk-453453vfgsdf-sdf23r23423\",\n     \"os\": \"Android\",\n     \"device_id\": \"sdnviuweh54398fhdsjfgh9sdfg\"\n }\n(Alternative) Associate this user with this device as an endpoint for push notifications in AWS\n {\n     \"unsubscribe\": false,\n     \"token\":\"45n4jgk-453453vfgsdf-sdf23r23423\",\n     \"os\": \"IOS\",\n     \"device_id\": \"dfg4t43fdf3423434tdg\"\n }\nRemove the endpoint associating this user with this device form the AWS Console\n {\n     \"unsubscribe\": true,\n     \"token\": \"45n4jgk-453453vfgsdf-sdf23r23423\",\n     \"os\": \"Android\",\n     \"device_id\": \"sdnviuweh54398fhdsjfgh9sdfg\"\n }",
          "type": "json"
        }
      ]
    },
    "type": "",
    "url": "",
    "filename": "./routes/v1/update/pushNotifications/subscriptions.js",
    "groupTitle": "Update_-_PushNotifications",
    "header": {
      "fields": {
        "Header": [
          {
            "group": "Header",
            "type": "String",
            "optional": false,
            "field": "Authorization",
            "description": "<p>The API Authorization Token. Without this token, no endpoint will be reachable. Value should follow the format &quot;Bearer: MY_TOKEN_HERE&quot;. Please see this example for more information: https://stackoverflow.com/a/22565038.</p>"
          }
        ]
      }
    }
  },
  {
    "version": "1.0.0",
    "name": "Enable/Disable_Push_notifications",
    "group": "Update_-_Settings",
    "description": "<p>Allows users to toggle whether to receive push notifications or nawwww</p>",
    "parameter": {
      "fields": {
        "Body Parameters": [
          {
            "group": "Body Parameters",
            "type": "boolean",
            "optional": false,
            "field": "pushNotifications",
            "description": "<p>True/False either receive or don't receive push notifications</p>"
          }
        ]
      },
      "examples": [
        {
          "title": "Toggle this users push notifications",
          "content": "Enable push notifications\n {\n     \"pushNotifications\": true\n }\nDisable push notifications\n {\n     \"pushNotifications\": false\n }",
          "type": "json"
        }
      ]
    },
    "type": "",
    "url": "",
    "filename": "./routes/v1/update/settings/emailSettings.js",
    "groupTitle": "Update_-_Settings",
    "header": {
      "fields": {
        "Header": [
          {
            "group": "Header",
            "type": "String",
            "optional": false,
            "field": "Authorization",
            "description": "<p>The API Authorization Token. Without this token, no endpoint will be reachable. Value should follow the format &quot;Bearer: MY_TOKEN_HERE&quot;. Please see this example for more information: https://stackoverflow.com/a/22565038.</p>"
          }
        ]
      }
    }
  },
  {
    "version": "1.0.0",
    "name": "RespondeToDirectTrade",
    "group": "Update_-_Trades",
    "description": "<p>Update a direct trade</p>",
    "parameter": {
      "fields": {
        "Body Parameters": [
          {
            "group": "Body Parameters",
            "type": "integer",
            "size": "1-&infin;",
            "optional": false,
            "field": "directTradeID",
            "description": "<p>ID for the direct Trade being responded to</p>"
          },
          {
            "group": "Body Parameters",
            "type": "string",
            "optional": false,
            "field": "response",
            "description": "<p>The response to this direct Trade, either 'accept' or 'decline' or &quot;cancel&quot;</p>"
          }
        ]
      },
      "examples": [
        {
          "title": "Respond to a direct trade with id 402",
          "content": "Accept the direct trade:\n {\n     \"directTradeID\": 402,\n     \"response\": \"accept\"\n }\nDecline the direct trade:\n {\n     \"directTradeID\": 402,\n     \"response\": \"decline\"\n }",
          "type": "json"
        }
      ]
    },
    "type": "",
    "url": "",
    "filename": "./routes/v1/update/trades/directTrades.js",
    "groupTitle": "Update_-_Trades",
    "header": {
      "fields": {
        "Header": [
          {
            "group": "Header",
            "type": "String",
            "optional": false,
            "field": "Authorization",
            "description": "<p>The API Authorization Token. Without this token, no endpoint will be reachable. Value should follow the format &quot;Bearer: MY_TOKEN_HERE&quot;. Please see this example for more information: https://stackoverflow.com/a/22565038.</p>"
          }
        ]
      }
    }
  },
  {
    "version": "1.0.0",
    "name": "UpdateTradePosting",
    "group": "Update_-_Trades",
    "description": "<p>Update a trade posting so it, and all responses, are no longer valid</p>",
    "parameter": {
      "fields": {
        "Body Parameters": [
          {
            "group": "Body Parameters",
            "type": "integer",
            "size": "1-&infin;",
            "optional": false,
            "field": "tradePostingID",
            "description": "<p>for the trade posting being deleted</p>"
          }
        ]
      },
      "examples": [
        {
          "title": "Delete a trade posting with id 402",
          "content": "Delete a trade posting:\n {\n     \"tradePostingID\": 402,\n }",
          "type": "json"
        }
      ]
    },
    "type": "",
    "url": "",
    "filename": "./routes/v1/update/trades/tradePosting.js",
    "groupTitle": "Update_-_Trades",
    "header": {
      "fields": {
        "Header": [
          {
            "group": "Header",
            "type": "String",
            "optional": false,
            "field": "Authorization",
            "description": "<p>The API Authorization Token. Without this token, no endpoint will be reachable. Value should follow the format &quot;Bearer: MY_TOKEN_HERE&quot;. Please see this example for more information: https://stackoverflow.com/a/22565038.</p>"
          }
        ]
      }
    }
  },
  {
    "type": "get",
    "url": "/public/users",
    "title": "Get User Data",
    "version": "1.0.0",
    "name": "GetUsers",
    "group": "Users",
    "description": "<p>Retreive all Users (and optionally their tags) for each token</p>",
    "examples": [
      {
        "title": "Get all users for many tokens with tags",
        "content": "https://api.metricaid.com/public/users?token={token1},{token2}&includeTags=true",
        "type": "json"
      }
    ],
    "parameter": {
      "fields": {
        "Query Parameters": [
          {
            "group": "Query Parameters",
            "type": "String",
            "optional": false,
            "field": "token",
            "description": "<p>String - Token representing the site to access data for, or a comma delimited list of tokens for many sites.<br> ex) .../users?token=aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa<br>ex) .../users?token=aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa,bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb</p>"
          },
          {
            "group": "Query Parameters",
            "type": "Boolean",
            "optional": false,
            "field": "includeTags",
            "description": "<p>Boolean - Add a property 'tags' to each user. Contains tags the user has at each site.</p>"
          }
        ]
      }
    },
    "success": {
      "fields": {
        "Successful Request Structure": [
          {
            "group": "Successful Request Structure",
            "type": "Object",
            "optional": false,
            "field": "data",
            "description": "<p>array of objects with shift data</p>"
          },
          {
            "group": "Successful Request Structure",
            "type": "Object",
            "optional": false,
            "field": "paging",
            "description": "<p>we dont have paging or limits yet... (maybe never, dont abuse the system and we won't add it)</p>"
          },
          {
            "group": "Successful Request Structure",
            "type": "Object",
            "optional": false,
            "field": "status",
            "description": "<p>object containing error (or success) information</p>"
          },
          {
            "group": "Successful Request Structure",
            "type": "Object",
            "optional": false,
            "field": "executedAt",
            "description": "<p>when this request started</p>"
          },
          {
            "group": "Successful Request Structure",
            "type": "Object",
            "optional": false,
            "field": "timeElapsed",
            "description": "<p>time until a response was sent from the api</p>"
          },
          {
            "group": "Successful Request Structure",
            "type": "Object",
            "optional": false,
            "field": "error",
            "description": "<p>a boolean, will be true for success, <b>but you should always check this first after every request<b></p>"
          }
        ]
      },
      "examples": [
        {
          "title": "Success Example:",
          "content": "HTTP/1.1 200 OK\n {\n     \"data\": [\n         {\n             \"id\": 0,                        // Id of the user, can be used for filtering in the schedule route\n             \"fname\": \"FirstName\",           // users first name (contact your site chief for uncertainties)\n             \"mname\": \"MiddleName\",          // users middle name ^^ (may be an empty string)\n             \"lname\": \"LastName\",            // users last name (these comments must be really helpful)\n             \"prefix\": \"Dr.\",                // some users have prefixes such as Dr. or Mr. or Mrs. (may be an empty string)\n             \"tags\": [                       // array of tag objects\n                 {\n                     \"id\": 0,                // id of the tag (I may remove this as its not useful)\n                     \"site_id\": 1,           // the site_id this tag is for. (If only one token is used this will be constant)\n                     \"name\": \"TagName\",      // the name of the tag, these can be used for filtering in the schedule route\n                     \"color\": \"#fc6400\"      // the colour of the tag as it is represented in the MetricAid tool\n                 },\n                 {\n                     .... // May be more, check tags.length for each user\n                 }\n             ]\n         },\n         {\n             .... // Potentially more object as above with different data. Check data.length to know how many records were retrieved.\n         }\n     ],\n     \"paging\": null,                         // no paging yet...\n     \"status\": {\n         \"code\": \"General.Success\",          // the status code is General.Success (That means in general it was successful)\n         \"message\": \"Success\"                // if there was an error this message will get you a better clue of what went wrong\n     },\n     \"executedAt\": \"2021-08-24T21:25:36.670Z\",   // time the request was received\n     \"timeElapsed\": 82,                      // time from request reeived to a response sent\n     \"error\": false                          // no error so its false, always check this on every response retrieved.\n }",
          "type": "json"
        }
      ]
    },
    "error": {
      "fields": {
        "Error Codes": [
          {
            "group": "Error Codes",
            "type": "Object",
            "optional": false,
            "field": "status",
            "description": "<p>Object containing error information</p>"
          },
          {
            "group": "Error Codes",
            "type": "String",
            "optional": false,
            "field": "status.code",
            "description": "<p>status.code - String containing the error code we represent internally. See below for a list of possible errors</p>"
          },
          {
            "group": "Error Codes",
            "type": "String",
            "optional": false,
            "field": "status.code.Parameter_Error_Parsing",
            "description": "<ul> <li>parameter.error.parsing - Failed to parse a query param from the request. See status.message for more details.</li> </ul>"
          },
          {
            "group": "Error Codes",
            "type": "String",
            "optional": false,
            "field": "status.code.URI_Malformed",
            "description": "<ul> <li>URI.Malformed - The URI you requested is malforned. Check above examples and make sure you dont have uneccesary or non uni-code characters in the URI.</li> </ul>"
          },
          {
            "group": "Error Codes",
            "type": "String",
            "optional": false,
            "field": "status.code.General_Error",
            "description": "<ul> <li>general.error - Something went wrong internally. Feel free to report this to our client service team.</li> </ul>"
          },
          {
            "group": "Error Codes",
            "type": "String",
            "optional": false,
            "field": "status.code.Database_Error_Querying",
            "description": "<ul> <li>database.error.querying - Something went wrong internally. Feel free to report this to our client service team.</li> </ul>"
          },
          {
            "group": "Error Codes",
            "type": "String",
            "optional": false,
            "field": "status.message",
            "description": "<p>status.message - String containing additional information about what error occured.</p>"
          }
        ]
      },
      "examples": [
        {
          "title": "Example Error Response with comments explaining how to break down the response:",
          "content": "HTTP/1.1 404 Not Found\n{\n    \"data\": {}, // No data to return\n    \"paging\": null, // we dont have pagination required just yet\n    \"status\": {\n        \"code\": \"Parameter.Error.Parsing\", // from this we know a parameter was passed incorrectly.\n        \"message\": \"API access token {aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaa} has an invalid format.\\n\" // We used a bad api token, aaa.... is obviously an invalid token\n    },\n    \"executedAt\": \"2021-08-24T21:17:51.996Z\", // when the request started\n    \"timeElapsed\": 29, // time in ms till a response was sent\n    \"error\": true  // a boolean that can be checked programatically after every request, if true then something went wrong and you need to react to it.\n}",
          "type": "json"
        }
      ]
    },
    "filename": "./routes/public/users/get.js",
    "groupTitle": "Users"
  }
] });
