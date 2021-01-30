"use strict";

/*
This is a file from Vanilla-Tools (https://github.com/suppenhuhn79/vanilla-tools)
Copyright 2021 Christoph Zager, licensed under the Apache License, Version 2.0
See the full license text at http://www.apache.org/licenses/LICENSE-2.0
 */

let htmlBuilder = {};

htmlBuilder.newNode = function (nodeDefinition, attributes = {})
{
	let htmlTag = /^[^#.\s]+/.exec(nodeDefinition)[0];
	let result = document.createElement(htmlTag);
	let idDefinition = /#([^.\s]+)/.exec(nodeDefinition);
	if (idDefinition !== null)
	{
		result.id = idDefinition[1];
	};
	let cssClassesRex = /\.([^.\s]+)/g;
	let cssClassMatch = cssClassesRex.exec(nodeDefinition);
	while (cssClassMatch !== null)
	{
		result.classList.add(cssClassMatch[1]);
		cssClassMatch = cssClassesRex.exec(nodeDefinition);
	};
	for (let attributeKey in attributes)
	{
		if (attributeKey.startsWith("data-") === true)
		{
			result.setAttribute(attributeKey, attributes[attributeKey]);
		}
		else
		{
			result[attributeKey] = attributes[attributeKey];
		};
	};
	return result;
};


htmlBuilder.removeNodesByQuerySelectors = function (querySelectors, rootNode = document)
{
	for (let s = 0, ss = querySelectors.length; s < ss; s += 1)
	{
		let nodes = rootNode.querySelectorAll(querySelectors[s]);
		for (let n = 0, nn = nodes.length; n < nn; n += 1)
		{
			nodes[n].remove();
		};
	};
};

htmlBuilder.removeClasses = function (classes, rootNode = document)
{
	for (let c = 0, cc = classes.length; c < cc; c += 1)
	{
		rootNode.classList.remove(classes[c]);
		let nodes = rootNode.querySelectorAll("." + classes[c]);
		for (let n = 0, nn = nodes.length; n < nn; n += 1)
		{
			nodes[n].classList.remove(classes[c]);
		};
	};
};
