/*
 * Copyright 2012-2014 Stefan Kruppa
 * 
 * This file is part of myArmy.
 *
 * myArmy is free software: you can redistribute it and/or modify
 * it under the terms of the GNU Affero General Public License as 
 * published by the Free Software Foundation, either version 3 of 
 * the License, or (at your option) any later version.
 *
 * myArmy is distributed in the hope that it will be useful,
 * but WITHOUT ANY WARRANTY; without even the implied warranty of
 * MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
 * GNU Affero General Public License for more details.
 *
 * You should have received a copy of the GNU Affero General Public 
 * License along with myArmy.  If not, see <http://www.gnu.org/licenses/>.
 *
 */

"use strict";

function ChooserGui() {
	
	var unitsToShow = 0;
	
	this.init = function() {
		_dispatcher.bindEvent("postChangeFocCount", this, this.onPostChangeFocCount, _dispatcher.PHASE_STATE);
		_dispatcher.bindEvent("postStateRefresh", this, this.onPostStateRefresh, _dispatcher.PHASE_STATE);
		_dispatcher.bindEvent("postPrepareGui", this, this.onPostPrepareGui, _dispatcher.PHASE_STATE);
		_dispatcher.bindEvent("postChangeArmy", this, this.onPostChangeArmy, _dispatcher.PHASE_STATE);
		_dispatcher.bindEvent("postResetArmy", this, this.onPostResetArmy, _dispatcher.PHASE_STATE);
		_dispatcher.bindEvent("postChangeLanguage", this, this.onPostChangeLanguage, _dispatcher.PHASE_STATE);
		_dispatcher.bindEvent("preCallFragment", this, this.onPreCallFragment, _dispatcher.PHASE_STATE);
		_dispatcher.bindEvent("postChangeDetachmentType", this, this.onPostChangeDetachmentType, _dispatcher.PHASE_STATE);
		_dispatcher.bindEvent("mainmenu.postChangeSpecialDisplay", this, this.onPostChangeSpecialDisplay, _dispatcher.PHASE_STATE);
	};
	
	this.onPostChangeFocCount = function(event) {
		this.refreshSlotHeadings();
	};
	
	this.onPostStateRefresh = function(event) {
		traverseArmyUnit(this, this.refreshDirtySlots);
		this.refreshSlotHeadings();
	};
	
	this.onPostPrepareGui = function(event) {
		this.renderSlots();
		this.renderUnitSelectionTabs();
		this.renderEntries();
		this.refresh();
	};
	
	this.onPostChangeArmy = function(event) {
		this.refreshSlotHeadings();
		this.renderUnitSelectionTabs();
		this.renderEntries();
		this.refresh();
	};
	
	this.onPostResetArmy = function(event) {
		traverseArmyUnit(this, this.refreshDirtySlots);
		this.refreshSlotHeadings();
	};
	
	this.onPostChangeLanguage = function(event) {
		this.refreshEntries();
		this.refreshSlotHeadings();
	};
	
	this.onPreCallFragment = function(event, additionalData) {
		if(additionalData.newFragment == "chooser") {
			if(_guiState.isSmallDevice) {
				this.refreshEntries();
			}
		}
	};
	
	this.onPostChangeDetachmentType = function(event, additionalData) {
		this.refreshSlotHeadings();
	};
	
	this.onPostChangeSpecialDisplay = function(event) {
		this.refreshEntries();
	};
	
	
	this.refresh = function() {
		this.refreshSlotHeadings();
		this.refreshEntries();
	};
	
	/**
	 * This method renders the skeleton for each slot (heading and containers
	 * for slot entries and for selected entities). It does not fill these
	 * containers. The method assumes that the _guiState has been reset before!
	 * Otherwise the slots will be empty afterwards.
	 */
	this.renderSlots = function() {

		var designContainer = _gui.getElement(".designContainer");
		designContainer.children().remove();

		var slotMenu = _gui.getElement("#slotMenu");
		slotMenu.children().remove();

		if (_systemState.system == null) {
			return;
		}
		
		var slotMenuItem = span(_guiState.text["all"], "slotMenuItem-1", "menuButton");
		slotMenuItem.on(_guiState.clickEvent, function(event) {
			showSlot(-1);
		});
		slotMenu.append(slotMenuItem);
		
		var slotCount = 0;
		var selectedPage = -1;

		var sortedSlots = [];
		for ( var i in _systemState.slots) {
			sortedSlots.push(_systemState.slots[i]);
		}

		sortedSlots.sort(function(a, b) {
			return a.order - b.order;
		});

		for ( var i in sortedSlots) {
			var slot = sortedSlots[i];
			var slotId = slot.slotId;
			var slotName = _guiState.text[slot.slotName];

//			var visible = $.inArray(true, traverseArmyData(this, this.checkSlotVisible, { slotId : slotId })) > -1;

			slotCount++;

			var slotRow = div(null, "slotRow" + slotId, "containerChild");
			var slotentryChooserWrapper = div(null, "slotentryChooserWrapper" + slotId, "chooserListWrapper");
			var slotHeadingContainer = span(null, "slotHeadingContainer" + slotId, "slotHeadingContainer slotHeadingChooser");
			slotentryChooserWrapper.append(slotHeadingContainer);

			var slotHeading = span('', "slotHeading" + slotId, null, null);
			slotHeadingContainer.append(slotHeading);

			var slotentryChooserList = ul(null, "slotentryChooserList" + slotId, "chooserList");
			slotentryChooserWrapper.append(slotentryChooserList);

			slotRow.append(slotentryChooserWrapper);

			var slotentryListWrapper = div(null, "entriesPerSlotWrapper" + slotId, "slotlistEntryWrapper");
			slotentryListWrapper.append(span("&nbsp;", null, "slotHeadingContainer slotHeadingDesigner"));
			slotentryListWrapper.append(ul(null, "slotentryDesignerList" + slotId, "designerList"));
			if (!slot.visible) {
				slotRow.addClass("invisible empty");
			} else if (_guiState.isSmallDevice) {
				if (selectedPage == -1) {
					selectedPage = slotId;
				} else {
					slotRow.addClass("invisible empty");
				}
			}
			slotRow.append(slotentryListWrapper);

			slotMenuItem = span(slotName, "slotMenuItem" + slotId, "menuButton");
			if (!slot.visible) {
//				slotMenuItem.addClass("invisible empty");
			}
			slotMenuItem.on(_guiState.clickEvent, {	slotId : slotId	}, function(event) {
				showSlot(event.data.slotId);
			});
			slotMenu.append(slotMenuItem);

			designContainer.append(slotRow);
		}

	};

//	this.checkSlotVisible = function(armyData, armyIndex, additionalParams) {
//		return !isUndefined(armyData.entityslotCount[additionalParams.slotId])
//				&& (armyData.entityslotCount[additionalParams.slotId] > 0);
//	};
	
	this.renderUnitSelectionTabs = function() {
		$(".tabRow").remove();
		var tabRow = ol(null, null, "tabRow unitTabRow", null);
		if(_armyState.getArmyCount() < 2) {
			tabRow.addClass("invisible");
		}
		
		for(var i = 0; i < _armyState.getArmyDataCount(); i++) {
			var xLi = li(i + 1, null, "tab unitTab", null);
			if(unitsToShow == i) {
				xLi.addClass("selectedTab");
			}
			xLi.on(_guiState.clickEvent, { unitsToShow: i, target: this}, this.showUnitTab);
			tabRow.append(xLi);
		}
		_gui.getElement(".slotHeadingChooser").after(tabRow);
	};
	
	this.renderEntries = function() {
		if(_armyState.getArmyCount() == 0) {
			return;
		}
		if(_armyState.getArmy(unitsToShow, 0) == null) {
			unitsToShow = _armyState.getFirstArmyIndex();
		}
		
		var tabRows = _gui.getElement(".designContainer").find(".tabRow");
		if(_armyState.getArmyCount() < 2) {
			tabRows.addClass("invisible");
		} else {
			tabRows.removeClass("invisible");
		}
		
		for ( var i in _systemState.slots) {
			var slot = _systemState.slots[i];
			if(slot.visible) {
				_gui.getElement("#slotMenuItem" + slot.slotId).removeClass("invisible empty");
			} else {
				_gui.getElement("#slotMenuItem" + slot.slotId).addClass("invisible empty");
			}
//			this.renderSlotEntriesChooserForSlot(_systemState.slots[i]);
			var slotentryList = _gui.getElement("#slotentryChooserList" + slot.slotId);
			slotentryList.children().remove();
		}
		traverseArmyUnit(this, this.renderSlotEntries);
	};
	
	this.renderSlotEntries = function(armyUnit, armyUnitIndex, armyData, armyDataIndex) {
		for ( var i in armyUnit.getEntityslots()) {
			var entityslot = armyUnit.getEntityslot(i);
			if(!entityslot.enabled) {
				continue;
			}
			var entityslotId = entityslot.entityslotId;
			var slotentryList = _gui.getElement("#slotentryChooserList" + entityslot.slotId);
			var entity = armyUnit.getFromEntityPool(entityslot.entityId);
			var entityName = armyUnit.getText(entity.entityName);
			
			var cssClasses = this.getCssForEntry(armyUnit, entityslot);
			
			var xli = li(/*"&raquo; " +*/ entityName,
					"chooserEntry" + armyDataIndex + "_" + armyUnitIndex + "_" + entityslotId, cssClasses);
			xli.on(_guiState.clickEvent, {
				armyDataIndex : armyDataIndex,
                armyUnitIndex: armyUnitIndex,
				entityslotId : entityslotId
			}, function(event) {
				if (!wasClick(event)) {
					return false;
				}
				_controller.addEntry(event.data.armyDataIndex, event.data.armyUnitIndex, event.data.entityslotId, true);
			});
//			if (entityslot.availableState == 0) {
//				xli.append(span(" (" + _guiState.text["max"] + ")", null,
//				"maxAppendix ok"));
//			}
			slotentryList.append(xli);
		}
	};
	
	/**
	 * Refreshes the chooser elements (heading and entries) for the given slot.
	 * Will only refresh elements, so they need to already exist.
	 * This method needs to be called when the slot is dirty, which is when:
	 * - an entity was added in this slot
	 * - an entity was cloned in this slot
	 * - an entity was deleted in this slot
	 * - an option of an entity in this slot was selected or unselected
	 * - the value of a pool has changed (only when there is a dependent entityslot for that pool that belongs to this slot)
	 * 
	 * Also needs to be called when the user switches unit display to own units or to allies
	 */
//	this.refreshChooserSlot = function(slot) {
//		this.refreshSlotHeading(slot.slotId);
//		this.refreshEntriesForSlot(slot);
//	};
	
	this.refreshSlotHeadings = function() {
		for ( var i in _systemState.slots) {
			// TODO possibly add dirty-check
			this.refreshSlotHeading(i);
		}
	};

	this.refreshSlotHeading = function(slotId) {
		var slotHeading = _gui.getElement("#slotHeading" + slotId);
		if(slotHeading == null) {
			return;
		}
		slotHeading.children().remove();
		var slot = _systemState.slots[slotId];
		
		var slotHeadingText = getSlotHeadingText(slot);
		slotHeading.append(span(slotHeadingText + " ("));
		
		var isOk = true;

		var isFirst = true;
		var countPerArmyPerSlot = traverseArmyUnit(this, getChooserCountForArmy, {slotId: slotId});
        var countPerSlot = [];
        for(var i = 0; i < countPerArmyPerSlot.length; i++) {
            var countPerArmy = countPerArmyPerSlot[i];
            if(countPerArmy == null) {
                continue;
            }
            for(var j = 0; j < countPerArmy.length; j++) {
                if(isUndefined(countPerSlot[j])) {
                    countPerSlot[j] = 0;
                }
                countPerSlot[j] += countPerArmy[j];
            }
        }
		
		for(var i = 0; i < countPerSlot.length; i++) {
			var slotCount = countPerSlot[i]; 
			//if(slotCount == null) {
			//	continue;
			//}
			var thisText = "";
			if(!isFirst) {
				thisText += " + ";
			}
			thisText += slotCount;
			
			var detachmentType = _armyState.getArmyData(i).detachmentType;
				
			var isThisOk = checkSlotMinMax(detachmentType, slotId, slotCount);
			isOk = isOk && isThisOk;
			slotHeading.append(span(thisText, null, isThisOk ? '' : "emphasizedBad"));
			isFirst = false;
		}

		slotHeading.append(span(") : " + _armyState.pointsPerSlot[slotId] + " " + _guiState.text["points"]));
		slotHeading.removeClass("good bad");
		if(isOk) {
			slotHeading.addClass("good");
		} else {
			slotHeading.addClass("bad");
		}
		
		_gui.getElement("#slotMenuItem" + slotId).html(slotHeadingText);
	};
	
	function checkSlotMinMax(detachmentType, slotId, count) {
		var minCount = 0;
		if(!isUndefined(detachmentType.minSlotCounts) && !isUndefined(detachmentType.minSlotCounts[slotId])) {
			minCount = detachmentType.minSlotCounts[slotId];
		}
		var maxCount = Number.MAX_VALUE;
		if(!isUndefined(detachmentType.maxSlotCounts) && !isUndefined(detachmentType.maxSlotCounts[slotId])) {
			maxCount = detachmentType.maxSlotCounts[slotId];
		}
		
		return (count >= minCount) && (count <= maxCount);
	}
	
	this.refreshDirtySlots = function(armyUnit, armyUnitIndex, armyData, armyDataIndex) {
//		var dirtySlotIds = {}; // take object instead of array, so that we get a unique constraint for free
		for ( var i in armyUnit.getEntityslots()) {
			var entityslot = armyUnit.getEntityslot(i);
			if (entityslot.dirty) {
				this.refreshSlotentry(armyDataIndex, armyUnit, armyUnitIndex, entityslot);
//				dirtySlotIds[entityslot.slotId] = 1;
				entityslot.dirty = false;
			}
		}
//		for ( var i in dirtySlotIds) {
//			this.refreshChooserSlot(_systemState.slots[i]);
//		}
	};
	
	this.refreshEntries = function() {
		if(_armyState.getArmy(unitsToShow, 0) == null) {
			unitsToShow = _armyState.getFirstArmyIndex();
		}
		for ( var i in _systemState.slots) {
			this.refreshEntriesForSlot(_systemState.slots[i]);
		}
	};
	
	this.refreshSlotentry = function(armyDataIndex, armyUnit, armyUnitIndex, entityslot) {
		var entry = $("#chooserEntry" + armyDataIndex + "_" + armyUnitIndex + "_" + entityslot.entityslotId);
		entry.removeClass();
		entry.addClass(this.getCssForEntry(armyUnit, entityslot));
	};
	
	this.refreshEntriesForSlot = function(slot) {
		var rowElement = _gui.getElement("#slotRow" + slot.slotId);
		var menuElement = _gui.getElement("#slotMenuItem" + slot.slotId);
		var hasElements = ($.inArray(true, traverseArmyUnit(this, this.refreshForArmyUnit, {slotId: slot.slotId}))) > -1;
		if(slot.visible) {
			menuElement.removeClass("invisible");
		} else {
			menuElement.addClass("invisible");
		}
		
		if(!slot.visible || (_guiState.isSmallDevice && _currentSlotId > -1 && slot.slotId != _currentSlotId)) {
			rowElement.addClass("invisible empty");
		} else {
			rowElement.removeClass("invisible empty");
		}
		
		var tabRow = rowElement.find(".tabRow");
		var tabs = tabRow.children();
		tabs.removeClass("selectedTab");
		tabs.filter(":eq(" + unitsToShow + ")").addClass("selectedTab");
	};
	
	this.refreshForArmyUnit = function(armyUnit, armyUnitIndex, armyData, armyDataIndex, additionalParams) {
		for ( var j in armyUnit.getEntityslots()) {
			var entityslot = armyUnit.getEntityslot(j);
			if (entityslot.slotId != additionalParams.slotId) {
				continue;
			}
			
			var entry = $("#chooserEntry" + armyDataIndex + "_" + armyUnitIndex + "_" + entityslot.entityslotId);
			entry.removeClass();
			entry.addClass(this.getCssForEntry(armyUnit, entityslot));
			var entity = armyUnit.getFromEntityPool(entityslot.entityId);
			var entityName = armyUnit.getText(entity.entityName);
			entry.html(entityName);
		}
		return armyData.entityslotCount[additionalParams.slotId] > 0;
	};
	
	this.getCssForEntry = function(armyUnit, entityslot) {
		var cssClass = "";
		switch (entityslot.availableState) {
            case 1:
                cssClass = "good";
                break;
            case 0:
                cssClass = "ok";
                break;
            case -1:
                cssClass = "bad";
                break;
            // case -2:
            // cssClass = "invisible";
            // break;
		}
		
		if(entityslot.armyDataIndex != unitsToShow) {
			cssClass += " invisible";
		}
		if(!_gui.checkDisplay(armyUnit.getFromEntityPool(entityslot.entityId))) {
			cssClass += " invisible";
		}
		
		return cssClass;
	};
	
	this.showUnitTab = function(event) {
		if (!wasClick(event)) {
			return false;
		}
		unitsToShow = event.data.unitsToShow;
		event.data.target.refreshEntries();
	};
	
}