"use strict";

/*
This is a file from Vanilla-Tools (https://github.com/suppenhuhn79/vanilla-tools)
Copyright 2021 Christoph Zager, licensed under the Apache License, Version 2.0
See the full license text at http://www.apache.org/licenses/LICENSE-2.0
 */

let htmlBuilder = {};

htmlBuilder.adjust = function (element, anchorElement, adjustment = "below bottom, start left")
{
	/* initial position: "start left, top below" */
	let anchorRect =	anchorElement.getBoundingClientRect();
	let position = {};
	/* vertical adjustment */
	position["y"] = (/\bbottom\b/i.exec(adjustment) !== null) ? anchorRect.bottom : anchorRect.top;
	position.y -= (/\babove\b/i.exec(adjustment) !== null) ? element.offsetHeight : 0;
	position.y += (/\bmiddle\b/i.exec(adjustment) !== null) ? ((anchorRect.height - element.offsetHeight) / 2) : 0;
	/* horizontal adjustment */
	position["x"] = (/\bright\b/i.exec(adjustment) !== null) ? anchorRect.right : anchorRect.left;
	position.x -= (/\bend\b/i.exec(adjustment) !== null) ? element.offsetWidth : 0;
	position.x += (/\bcenter\b/i.exec(adjustment) !== null) ? ((anchorRect.width - element.offsetWidth) / 2) : 0;
	/* prevent exceeding the docment client area */
	let exceedings =
	{
		"x": document.documentElement.offsetWidth - position.x - element.offsetWidth,
		"y": document.documentElement.offsetHeight - position.y - element.offsetHeight
	};
	position.x += (exceedings.x < 0) ? exceedings.x : 0;
	position.y += (exceedings.y < 0) ? exceedings.y : 0;
	/* prevent positions < 0 */
	position.y = (position.y < 0) ? 0 : position.y;
	position.x = (position.x < 0) ? 0 : position.x;
	/* set position */
	element.style.top = Math.round(document.documentElement.scrollTop + position.y) + "px";
	element.style.left = Math.round(document.documentElement.scrollLeft + position.x) + "px";
};

htmlBuilder.newElement = function (nodeDefinition, attributes = {})
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
