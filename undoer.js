"use strict";

/*
Copyright 2021 Christoph Zager - https://github.com/Suppenhuhn79/vanilla-tools
Licensed under the Apache License, Version 2.0 - http://www.apache.org/licenses/LICENSE-2.0
 */

class Undoer
{
	constructor()
	{
		this.snapshots = [];
	};

	get canUndo()
	{
		return (this.snapshots.length > 0);
	};

	get lastChangeDescription()
	{
		return (this.canUndo === true) ? String(this.snapshots[this.snapshots.length - 1].description) : null;
	};

	saveSnapshot(data, description)
	{
		if ((this.snapshots.length === 0) || (data !== this.snapshots[this.snapshots.length - 1].data))
		{
			this.snapshots.push(
			{
				"data": data,
				"description": description
			}
			);
		};
	};

	undo()
	{
		let result = null;
		if (this.canUndo === true)
		{
			result = String(this.snapshots[this.snapshots.length - 1].data);
			this.snapshots.pop();
		};
		return result;
	};

	clear()
	{
		this.snapshots = [];
	};

};
