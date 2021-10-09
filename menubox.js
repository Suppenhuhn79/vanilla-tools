"use strict";

/*
This is a file from Vanilla-Tools (https://github.com/suppenhuhn79/vanilla-tools)
Copyright 2021 Christoph Zager, licensed under the Apache License, Version 2.0
See the full license text at http://www.apache.org/licenses/LICENSE-2.0
 */

/* requires htmlbuilder.js */

class Menubox
{
	constructor(id, menuJson, eventHandler = null, _parentMenubox = null)
	{
		this.id = id;
		if (Menubox.instances[this.id])
		{
			console.info("Menubox \"" + this.id + "\" already existed, has been replaced.");
			document.body.querySelector("[data-menubox=\"" + id + "\"]")?.remove();
		};
		this.eventHandler = eventHandler;
		this.parentMenubox = _parentMenubox;
		this.selectMode = menuJson.selectMode ?? ((menuJson.multiselect === true) ? Menubox.SelectMode.multiselect : Menubox.SelectMode.normal);
		this.multiselect = ([Menubox.SelectMode.multiselect, Menubox.SelectMode.multiselect_interactive].includes(this.selectMode));
		this.adjust = Object.assign(
		{
			visibility: ["hidden", "visible"]
		}, menuJson.adjust);
		this.element = htmlBuilder.newElement("div.menubox",
		{
			'data-menubox': id,
			onclick: (evt) => { evt.stopPropagation(); }
		}, htmlBuilder.newElement("div", htmlBuilder.newElement("div.items"))); // wrapper DIV is required for transistions
		if (_parentMenubox)
		{
			this.element.classList.add("submenu");
		};
		this.element.style.position = menuJson.position ?? "absolute";
		this.element.style.top = "0px";
		this.element.style.left = "0px";
		if (typeof menuJson.css === "string")
		{
			for (let cssClass of menuJson.css.split(" "))
			{
				this.element.classList.add(cssClass);
			};
		};
		this.setTitle(menuJson.title);
		this.setItems((menuJson.items instanceof Array) ? menuJson.items : menuJson);
		if (menuJson.buttons instanceof Array)
		{
			let buttonsContainer = htmlBuilder.newElement("div.buttons");
			for (let menuButton of menuJson.buttons)
			{
				buttonsContainer.appendChild(htmlBuilder.newElement("div.menubutton",
					{
						'data-menubutton': menuButton.key,
						onclick: Menubox.onMenuItemClick
					},
					menuButton.label ?? menuButton.key));
			};
			this.element.firstElementChild.appendChild(buttonsContainer);
		};
		document.body.appendChild(this.element);
		Menubox.instances[this.id] = this;
		Menubox.hideAll();
	};

	static EVENT_ID = "menubox";

	static SelectMode = {
		normal: 0,
		persistent: 1,
		multiselect: 2,
		multiselect_interactive: 3
	};
	
	static instances = {};

	static hideAll(exceptFor = "")
	{
		for (let key in Menubox.instances)
		{
			if (exceptFor.startsWith(key) === false)
			{
				Menubox.instances[key].setVisibility(false);
			}
		};
	};

	static onMenuItemClick(clickEvent)
	{
		clickEvent.stopPropagation();
		if ((clickEvent.target instanceof HTMLInputElement === false) && (clickEvent.target.classList.contains("disabled") === false))
		{
			let menuboxItem = clickEvent.target.closest("[data-menuitem]");
			let menuboxButton = clickEvent.target.closest("[data-menubutton]");
			let menubox = Menubox.instances[clickEvent.target.closest("[data-menubox]").getAttribute("data-menubox")];
			let submenuId = menuboxItem?.getAttribute("data-submenu");
			if (menuboxItem)
			{
				if (submenuId)
				{
					let submenu = menubox.submenus[submenuId];
					Menubox.hideAll(submenuId);
					submenu.popup(clickEvent, menubox.context, menuboxItem, submenu.alignment);
				}
				else if (menubox.multiselect)
				{
					menuboxItem.classList.toggle("selected");
				};
			};
			if (((menubox.selectMode === Menubox.SelectMode.normal) || (menuboxButton)) && (!submenuId))
			{
				Menubox.hideAll();
				/* dispatch event */
				let eventDetails =
				{
					context: menubox.context,
					menubox: menubox
				};
				if (menuboxItem) {
					eventDetails.itemKey = menuboxItem.getAttribute("data-menuitem");
				}
				else if (menuboxButton)
				{
					eventDetails.buttonKey = menuboxButton.getAttribute("data-menubutton");
				};
				if (menubox.multiselect)
				{
					eventDetails.selectedKeys = [];
					for (let item of menubox.element.querySelectorAll("[data-menuitem].selected"))
					{
						eventDetails.selectedKeys.push(item.getAttribute("data-menuitem"));
					};
				};
				if (typeof menubox.eventHandler === "function")
				{
					menubox.eventHandler(Object.assign(eventDetails, { originalEvent: clickEvent}));
				}
				else
				{
					window.dispatchEvent(new CustomEvent(Menubox.EVENT_ID, { detail: eventDetails }));
				};
			};
		};
	};

	setVisibility(visible)
	{
		let styleIndex = (visible) ? 1 : 0;
		for (let key in this.adjust)
		{
			let styleValue = this.adjust[key][styleIndex];
			if ((key === "height") && (styleValue === "auto"))
			{
				styleValue = this.element.firstElementChild.offsetHeight + "px";
			}
			else if ((key === "width") && (styleValue === "auto"))
			{
				styleValue = this.element.firstElementChild.offsetWidth + "px";
			};
			this.element.style[key] = styleValue;
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
		if ((itemDef.key === undefined) && (itemDef.separator === undefined) && (itemDef.html === undefined))
		{
			for (let key in itemDef)
			{
				if (typeof itemDef[key] === "string")
				{
					itemDef =
					{
						key: key,
						label: itemDef[key]
					};
				}
				else
				{
					itemDef =
					{
						separator: {}
					}
				};
				break;
			};
		};
		let itemElement;
		if (itemDef.separator)
		{
			itemElement = htmlBuilder.newElement("div.separator", "\u00a0");
		}
		else if (itemDef.href)
		{
			itemElement = htmlBuilder.newElement("a.menuitem", {href: itemDef.href}, itemDef.label ?? itemDef.href);
		}
		else if ((itemDef.html) && (!itemDef.key))
		{
			itemElement = itemDef.html;
		};
		if (itemDef.key)
		{
			itemElement = htmlBuilder.newElement("div.menuitem", 
				{
					'data-menuitem': itemDef.key,
					onclick: itemDef.onclick ?? Menubox.onMenuItemClick
				}, itemDef.html ?? itemDef.label ?? ((itemDef.input) ? "" : itemDef.key)
			);
			if (itemDef.input)
			{
				let inputElement = htmlBuilder.newElement("input", {type: itemDef.input});
				for (let itemDefKey in itemDef)
				{
					if (["key", "label", "input"].includes(itemDefKey) === false)
					{
						console.log("adding", itemDefKey);
						inputElement[itemDefKey] = itemDef[itemDefKey];
					};
				};
				itemElement.appendChild(inputElement);
			}
			else if (itemDef.submenu)
			{
				let submenuId = this.id + "::" + itemDef.key;
				itemElement.setAttribute("data-submenu", submenuId);
				itemElement.classList.add("submenu");
				this.submenus ??= {};
				this.submenus[submenuId] = new Menubox(submenuId, itemDef.submenu, this.eventHandler, this);
				this.submenus[submenuId].alignment = itemDef.submenu.alignment ?? "start right, below top";
			}
			else if (this.multiselect)
			{
				itemElement.classList.add("multiselect");
			};
		};
		if (itemDef.icon)
		{
			itemElement.insertBefore(htmlBuilder.newElement("img", { src: itemDef.icon }), itemElement.firstChild);
		};
		if (itemDef.iconFontAwesome)
		{
			itemElement.insertBefore(htmlBuilder.newElement("i." + itemDef.iconFontAwesome.replace(" ", ".")), itemElement.firstChild);
		};
		if (itemDef.selected)
		{
			itemElement.classList.add("selected");
		};
		if (itemDef.enabled === false)
		{
			itemElement.classList.add("disabled");
		};
		this.element.querySelector("div.items").appendChild(itemElement);
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
		(beSelected) ? selectedItem?.classList.add("selected") : selectedItem?.classList.remove("selected");
	};

	setTitle(title)
	{
		let wrapperElement = this.element.firstElementChild;
		if (typeof title === "string")
		{
			let titleElement = wrapperElement.querySelector(".title");
			if (!titleElement)
			{
				titleElement = htmlBuilder.newElement("div.title");
				wrapperElement.insertBefore(titleElement, wrapperElement.firstElementChild);
			};
			titleElement.innerText = title;
		}
		else
		{
			wrapperElement.querySelector(".title")?.remove();
		};
	};
	
	popup(clickEvent, context = null, anchorElement = null, adjustment = "start left, below bottom")
	{
		if (!this.parentMenubox)
		{
			Menubox.hideAll();
		};
		if (clickEvent instanceof MouseEvent)
		{
			clickEvent.stopPropagation();
			if ((anchorElement instanceof HTMLElement) === false)
			{
				this.element.style.top = clickEvent.clientY + document.documentElement.scrollTop + "px";
				this.element.style.left = clickEvent.clientX + document.documentElement.scrollLeft + "px";
			};
		};
		if (anchorElement instanceof HTMLElement)
		{
			htmlBuilder.adjust(this.element, anchorElement, adjustment);
		};
		this.context = context;
		this.setVisibility(true);
	};

};

window.addEventListener("click", (clickEvent) => ((clickEvent.target.closest("[data-menubox]") === null) ? Menubox.hideAll() : null));
