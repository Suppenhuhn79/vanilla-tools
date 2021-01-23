"use strict";

/*
Copyright 2021 Christoph Zager - https://github.com/Suppenhuhn79/vanilla-tools
Licensed under the Apache License, Version 2.0 - http://www.apache.org/licenses/LICENSE-2.0
 */

var storager = {};

storager.store = function (key, title, data)
{
	if (typeof localStorage !== "undefined")
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
	if (typeof localStorage !== "undefined")
	{
		let storedData = JSON.parse(localStorage.getItem(key));
		result = storedData;
		if (storedData !== null)
		{
			result["date"] = new Date(storedData.date);
		};
	};
	return result;
};
