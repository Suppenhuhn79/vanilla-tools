"use strict";

/*
This is a file from Vanilla-Tools (https://github.com/suppenhuhn79/vanilla-tools)
Copyright 2021 Christoph Zager, licensed under the Apache License, Version 2.0
See the full license text at http://www.apache.org/licenses/LICENSE-2.0
 */

/* requires htmlbuilder.js */

class Menubox
{
	constructor(id, menuJson)
	{
		function _createMenuButtons(...menuButtons)
		{
			let buttonsContainer = htmlBuilder.newElement("div.buttons");
			for (let menuButton of menuButtons)
			{
				buttonsContainer.appendChild(htmlBuilder.newElement("div",
					{
						"data-menubutton": menuButton.key,
						"onclick": Menubox.onMenuItemClick
					},
						menuButton.label));
			};
			this.element.appendChild(buttonsContainer);
		};
		this.id = id;
		this.multiselect = (menuJson.multiselect === true);
		this.element = htmlBuilder.newElement("div.menubox",
		{
			"data-menubox": id
		}
			);
		this.element.style.position = (!!menuJson.position) ? menuJson.position : "absolute";
		this.element.style.top = "0px";
		this.element.style.left = "0px";
		this.element.style.visibility = "hidden";
		if (typeof menuJson["class"] === "string")
		{
			for (let cssClass of menuJson["class"].split(" "))
			{
				this.element.classList.add(cssClass);
			};
		};
		if (typeof menuJson.title === "string")
		{
			this.element.appendChild(htmlBuilder.newElement("div.title", menuJson.title));
		};
		this.element.appendChild(htmlBuilder.newElement("div.items"));
		this.setItems((menuJson.items instanceof Array) ? menuJson.items : menuJson);
		if (menuJson.buttons instanceof Array)
		{
			_createMenuButtons.apply(this, menuJson.buttons);
		};
		if (Menubox.instances[this.id])
		{
			console.warn("Menubox \"" + this.id + "\" did already exist, has been replaced.");
			let existingMenu = document.body.querySelector("[data-menubox=\"" + id + "\"]");
			if (existingMenu)
			{
				existingMenu.remove()
			};
		};
		Menubox.instances[this.id] = this;
		document.body.appendChild(this.element);
	};

	static instances = {};

	static hideAll()
	{
		for (let key in Menubox.instances)
		{
			Menubox.instances[key].element.style.visibility = "hidden";
		};
	};

	static onMenuItemClick(clickEvent)
	{
		let menubox = Menubox.instances[clickEvent.target.closest("[data-menubox]").getAttribute("data-menubox")];
		let menuEvent = new CustomEvent("menubox",
		{
			"detail":
			{
				"context": menubox.context,
				"menubox": menubox
			}
		}
			);
		if (!!clickEvent.target.getAttribute("data-menubutton"))
		{
			menuEvent.detail["buttonKey"] = clickEvent.target.getAttribute("data-menubutton");
			menuEvent.detail["selectedKeys"] = [];
			let selectedItems = menubox.element.querySelectorAll("[data-menuitem].selected");
			for (let i = 0, ii = selectedItems.length; i < ii; i += 1)
			{
				menuEvent.detail.selectedKeys.push(selectedItems[i].getAttribute("data-menuitem"));
			};
			window.dispatchEvent(new CustomEvent("menubox", menuEvent));
			Menubox.hideAll();
		}
		else
		{
			if (menubox.multiselect)
			{
				clickEvent.target.classList.toggle("selected");
				clickEvent.stopPropagation();
			}
			else
			{
				menuEvent.detail["itemKey"] = clickEvent.target.getAttribute("data-menuitem");
				window.dispatchEvent(new CustomEvent("menubox", menuEvent));
				Menubox.hideAll();
			};
		};
	};

	setItems(itemDefs)
	{
		let itemsContainer = this.element.querySelector("div.items");
		htmlBuilder.removeAllChildren(itemsContainer);
		if (itemDefs instanceof Array)
		{
			for (let itemDef of itemDefs)
			{
				this.appendItem(itemDef);
			};
		}
		else
		{
			for (let key in itemDefs)
			{
				this.appendItem(
				{
					[key]: itemDefs[key]
				}
				);
			};
		};
	};

	appendItem(itemDef)
	{
		if ((itemDef.key === undefined) && (itemDef.separator === undefined))
		{
			for (let key in itemDef)
			{
				if (typeof itemDef[key] === "string")
				{
					itemDef =
					{
						"key": key,
						"label": itemDef[key]
					};
				}
				else
				{
					itemDef =
					{
						"separator": {}
					}
				};
				break;
			};
		};
		let itemNode;
		if (!itemDef.separator)
		{
			itemNode = htmlBuilder.newElement("div",
			{
				"data-menuitem": itemDef.key,
				"onclick": Menubox.onMenuItemClick
			}, itemDef.label);
			if (itemDef.selected)
			{
				itemNode.classList.add("selected");
			};
		}
		else
		{
			itemNode = htmlBuilder.newElement("div.separator", "&#160;");
		};
		this.element.querySelector("div.items").appendChild(itemNode);
	};

	selectItem(itemKey, beSelected = true)
	{
		if (this.multiselect === false)
		{
			for (let item of this.element.querySelectorAll("[data-menuitem]"))
			{
				item.classList.remove("selected");
			};
		};
		let selectedItem = this.element.querySelector("[data-menuitem=\"" + itemKey + "\"]");
		if (selectedItem)
		{
			(beSelected) ? selectedItem.classList.add("selected") : selectedItem.classList.remove("selected");
		};
	};

	popup(clickEvent, context = null, anchorElement = null, adjustment = "start left, below bottom")
	{
		Menubox.hideAll();
		if (clickEvent instanceof MouseEvent)
		{
			clickEvent.stopPropagation();
			if (anchorElement instanceof HTMLElement)
			{
				htmlBuilder.adjust(this.element, anchorElement, adjustment);
			}
			else
			{
				this.element.style.top = clickEvent.clientY + document.documentElement.scrollTop + "px";
				this.element.style.left = clickEvent.clientX + document.documentElement.scrollLeft + "px";
			};
			this.context = context;
			this.element.style.visibility = "visible";
		};
	};

};

window.addEventListener("click", (clickEvent) => ((clickEvent.target.closest("[data-menubox]") === null) ? Menubox.hideAll() : null));
