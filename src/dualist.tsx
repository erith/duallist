import { useEffect, useMemo, useRef, useState } from "react";

export type Item = {
    groupId: string;
    floorId: string;
};

export type Checkable = {
    checked: boolean;
};

export type CheckableItem = Item & Checkable;

type Props = {
    rvLineList: Item[];
    DefaultValues: Item[];
    OnCheckedItemsChange?: (
        allCheckedItems: Item[],
        changedItems: Item[],
    ) => void;
};

type GroupCount = {
    total: number;
    checked: number;
};

const itemKey = ({ groupId, floorId }: Item) => `${groupId}:${floorId}`;

const toItem = ({ groupId, floorId }: Item): Item => ({ groupId, floorId });

const normalizeCheckedKeys = (rvLineList: Item[], defaultValues: Item[]): Set<string> => {
    const availableKeys = new Set(rvLineList.map(itemKey));

    return defaultValues.reduce<Set<string>>((memo, item) => {
        const key = itemKey(item);
        if (availableKeys.has(key)) {
            memo.add(key);
        }

        return memo;
    }, new Set<string>());
};

export const DualList = ({
    rvLineList,
    DefaultValues,
    OnCheckedItemsChange,
}: Props) => {
    const [checkedKeys, setCheckedKeys] = useState<Set<string>>(() =>
        normalizeCheckedKeys(rvLineList, DefaultValues),
    );
    const [groupKey, setGroupKey] = useState<string | null>(rvLineList[0]?.groupId ?? null);
    const [isDragging, setIsDragging] = useState(false);
    const draggedKeysRef = useRef<Set<string>>(new Set());
    const dragCheckedStateRef = useRef<boolean | null>(null);

    const itemMap = useMemo(
        () => new Map(rvLineList.map((item) => [itemKey(item), item])),
        [rvLineList],
    );

    const groupMap = useMemo(() => {
        const nextGroupMap = new Map<string, Item[]>();

        rvLineList.forEach((item) => {
            const items = nextGroupMap.get(item.groupId);
            if (items) {
                items.push(item);
                return;
            }

            nextGroupMap.set(item.groupId, [item]);
        });

        return nextGroupMap;
    }, [rvLineList]);

    useEffect(() => {
        setCheckedKeys(normalizeCheckedKeys(rvLineList, DefaultValues));
    }, [rvLineList, DefaultValues]);

    useEffect(() => {
        if (rvLineList.length === 0) {
            setGroupKey(null);
            return;
        }

        if (groupKey && groupMap.has(groupKey)) {
            return;
        }

        setGroupKey(rvLineList[0].groupId);
    }, [groupKey, groupMap, rvLineList]);

    const checkedItems = useMemo(
        () => rvLineList.filter((item) => checkedKeys.has(itemKey(item))),
        [checkedKeys, rvLineList],
    );

    const selectedItemsText = useMemo(
        () => checkedItems.map((item) => item.floorId).join(", "),
        [checkedItems],
    );

    const { groupCounts, groupItems } = useMemo(() => {
        const nextGroupCounts: Record<string, GroupCount> = {};
        const nextGroupItems = (groupKey ? groupMap.get(groupKey) : []) ?? [];

        rvLineList.forEach((item) => {
            const count = nextGroupCounts[item.groupId] ?? { total: 0, checked: 0 };
            count.total += 1;

            if (checkedKeys.has(itemKey(item))) {
                count.checked += 1;
            }

            nextGroupCounts[item.groupId] = count;
        });

        return {
            groupCounts: nextGroupCounts,
            groupItems: nextGroupItems.map((item) => ({
                ...item,
                checked: checkedKeys.has(itemKey(item)),
            })),
        };
    }, [checkedKeys, groupKey, groupMap, rvLineList]);

    const isAllGroupItemsChecked =
        groupItems.length > 0 && groupItems.every((item) => item.checked);

    const emitCheckedItemsChange = (nextCheckedKeys: Set<string>, changedItems: CheckableItem[]) => {
        OnCheckedItemsChange?.(
            rvLineList.filter((item) => nextCheckedKeys.has(itemKey(item))).map(toItem),
            changedItems.filter((item) => item.checked).map(toItem),
        );
    };

    const setItemChecked = (targetKey: string, checked: boolean) => {
        const targetItem = itemMap.get(targetKey);
        if (!targetItem) {
            return;
        }

        setCheckedKeys((currentCheckedKeys) => {
            const isAlreadyChecked = currentCheckedKeys.has(targetKey);
            if (isAlreadyChecked === checked) {
                return currentCheckedKeys;
            }

            const nextCheckedKeys = new Set(currentCheckedKeys);
            if (checked) {
                nextCheckedKeys.add(targetKey);
            } else {
                nextCheckedKeys.delete(targetKey);
            }

            emitCheckedItemsChange(nextCheckedKeys, [{ ...targetItem, checked }]);
            return nextCheckedKeys;
        });
    };

    const setGroupItemsChecked = (targetGroupKey: string, checked: boolean) => {
        const targetItems = groupMap.get(targetGroupKey);
        if (!targetItems || targetItems.length === 0) {
            return;
        }

        setCheckedKeys((currentCheckedKeys) => {
            const changedItems = targetItems
                .filter((item) => currentCheckedKeys.has(itemKey(item)) !== checked)
                .map((item) => ({ ...item, checked }));

            if (changedItems.length === 0) {
                return currentCheckedKeys;
            }

            const nextCheckedKeys = new Set(currentCheckedKeys);
            targetItems.forEach((item) => {
                const key = itemKey(item);
                if (checked) {
                    nextCheckedKeys.add(key);
                } else {
                    nextCheckedKeys.delete(key);
                }
            });

            emitCheckedItemsChange(nextCheckedKeys, changedItems);
            return nextCheckedKeys;
        });
    };

    const toggleAllGroupItems = () => {
        if (!groupKey) {
            return;
        }

        setGroupItemsChecked(groupKey, !isAllGroupItemsChecked);
    };

    const beginToggle = (targetKey: string) => {
        const nextChecked = !checkedKeys.has(targetKey);

        draggedKeysRef.current = new Set([targetKey]);
        dragCheckedStateRef.current = nextChecked;
        setIsDragging(true);
        setItemChecked(targetKey, nextChecked);
    };

    const dragToggle = (targetKey: string) => {
        if (
            !isDragging ||
            draggedKeysRef.current.has(targetKey) ||
            dragCheckedStateRef.current === null
        ) {
            return;
        }

        draggedKeysRef.current.add(targetKey);
        setItemChecked(targetKey, dragCheckedStateRef.current);
    };

    const endToggle = () => {
        draggedKeysRef.current.clear();
        dragCheckedStateRef.current = null;
        setIsDragging(false);
    };

    return (
        <div style={{ display: "flex", gap: 24, alignItems: "flex-start" }}>
            <div>
                <ul style={{ listStyle: "none", padding: 0, margin: 0 }}>
                    {Object.entries(groupCounts).map(([key, count]) => (
                        <li
                            key={key}
                            style={{
                                cursor: "pointer",
                                backgroundColor: groupKey === key ? "orange" : "transparent",
                                padding: "8px 12px",
                                borderRadius: 8,
                            }}
                            onClick={() => {
                                setGroupKey(key);
                                if (count.checked === 0) {
                                    setGroupItemsChecked(key, true);
                                }
                            }}
                        >
                            {key} ({count.checked})
                        </li>
                    ))}
                </ul>
            </div>
            <div>
                <button
                    type="button"
                    onClick={toggleAllGroupItems}
                    disabled={groupItems.length === 0}
                >
                    {isAllGroupItemsChecked ? "전체 해제" : "전체 선택"}
                </button>
                <ul
                    style={{ listStyle: "none", padding: 0, margin: 0, minWidth: 220 }}
                    onPointerLeave={endToggle}
                >
                    {groupItems.map((item) => {
                        const targetKey = itemKey(item);

                        return (
                            <li
                                key={targetKey}
                                style={{
                                    display: "flex",
                                    alignItems: "center",
                                    gap: 8,
                                    cursor: "pointer",
                                    userSelect: "none",
                                    padding: "8px 12px",
                                    borderRadius: 8,
                                    backgroundColor: item.checked ? "#e8f3ff" : "transparent",
                                }}
                                onPointerDown={() => beginToggle(targetKey)}
                                onPointerEnter={() => dragToggle(targetKey)}
                                onPointerUp={endToggle}
                            >
                                <input
                                    type="checkbox"
                                    checked={item.checked}
                                    readOnly
                                    style={{ pointerEvents: "none" }}
                                />
                                <span>{item.floorId}</span>
                            </li>
                        );
                    })}
                </ul>
            </div>
            <div style={{ minWidth: 220 }}>
                <strong>선택한 항목</strong>
                <div style={{ marginTop: 8 }}>
                    {selectedItemsText || "선택된 항목 없음"}
                </div>
            </div>
        </div>
    );
};

export default DualList;
