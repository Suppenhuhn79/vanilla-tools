"use strict";

/*
This is a file from Vanilla-Tools (https://github.com/suppenhuhn79/vanilla-tools)
Copyright 2021 Christoph Zager, licensed under the Apache License, Version 2.0
See the full license text at http://www.apache.org/licenses/LICENSE-2.0
 */

const storager = {};

storager.store = function (key, title, data)
{
	if (!!localStorage)
	{
		let storeData =
		{
			"title": title,
			"data": data,
			"date": new Date().toISOString()
		};
		localStorage.setItem(key, JSON.stringify(storeData));
	};
};

storager.retrieve = function (key)
{
	let result = null;
	if (!!localStorage)
	{
		let storedData = JSON.parse(localStorage.getItem(key));
		result = storedData;
		if (!!storedData)
		{
			result["date"] = new Date(storedData.date);
		};
	};
	return result;
};
