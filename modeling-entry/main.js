"use strict";

/*
  下一阶段会在这里连接两个详情页面。

  目前先确认两个互动入口能够正常显示。
*/

const modelingEntry =
  document.getElementById(
    "modelingEntry"
  );

const ue5Entry =
  document.getElementById(
    "ue5Entry"
  );

modelingEntry.addEventListener(
  "click",
  () => {
    console.log(
      "3D Modeling selected"
    );
  }
);

ue5Entry.addEventListener(
  "click",
  () => {
    console.log(
      "UE5 Level Prototype selected"
    );
  }
);