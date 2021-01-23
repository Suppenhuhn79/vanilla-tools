"use strict";

/*
Copyright 2021 Christoph Zager - https://github.com/Suppenhuhn79/vanilla-tools
Licensed under the Apache License, Version 2.0 - http://www.apache.org/licenses/LICENSE-2.0
 */

class DidYouKnow
{
	constructor(presentationNode, didYouKnows = [])
	{
		this.presentationNode = presentationNode;
		this.hints = didYouKnows;
		this.currentHintIndex = -1;
	};

	printRandomHint()
	{
		this.currentHintIndex = Math.floor(Math.random() * (this.hints.length));
		this.presentationNode.innerHTML = this.hints[this.currentHintIndex];
	};

	printNextHint()
	{
		this.currentHintIndex += 1;
		if (this.currentHintIndex >= this.hints.length)
		{
			this.currentHintIndex = 0;
		};
		this.presentationNode.innerHTML = this.hints[this.currentHintIndex];
	};
};
