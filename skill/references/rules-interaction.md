# 기본 동작 규칙

디자인이나 가이드에 따로 없을 때 항상 이렇게 만든다.

## 슬라이더는 드래그 가능

- 모든 슬라이더·캐러셀은 버튼과 함께 **마우스 드래그·터치 스와이프**로 넘길 수 있게 한다
- 따라 움직이는 트랙형(카드 목록)은 끄는 동안 트랙이 손을 따라오고, 놓으면 가장 가까운 카드로 맞춘다. 60px 이상 끌었는데 같은 카드면 끈 방향으로 한 칸 넘긴다
- 위치만 바뀌는 캐러셀(가운데 강조형)은 60px 이상 끌면 이전·다음으로 넘긴다
- 드래그 뒤에 카드 링크·클릭이 같이 눌리지 않게 capture 단계에서 click을 막는다
- 드래그 영역은 `cursor: grab`(끄는 중 `grabbing`), `user-select: none`, `touch-action: pan-y`(세로 스크롤은 살림), 안의 `img`는 `-webkit-user-drag: none`. 끄는 중에는 트랙의 transition을 끈다
- 스타일은 BEM 클래스에 믹스인으로 넣고, JS는 id로 잡는다 (`__` 훅 클래스에 스타일 금지)
- 트랙 이동값은 `offsetLeft`로 계산하므로 트랙(list)에 `position: relative`를 준다 (안 주면 offsetParent가 body가 되어 어긋난다)

```js
function bindDrag($area, handlers) {
    var startX = 0;
    var isDown = false;
    var isMoved = false;

    $area.on('pointerdown', function (e) {
        if (e.button !== 0) {
            return;
        }
        isDown = true;
        isMoved = false;
        startX = e.clientX;
        if (handlers.start) {
            handlers.start();
        }
    });
    $(document).on('pointermove', function (e) {
        var dx;

        if (!isDown) {
            return;
        }
        dx = e.clientX - startX;
        if (!isMoved && Math.abs(dx) > 6) {
            isMoved = true;
            $area.addClass('is-dragging');
        }
        if (isMoved && handlers.move) {
            handlers.move(dx);
        }
    });
    $(document).on('pointerup pointercancel', function (e) {
        if (!isDown) {
            return;
        }
        isDown = false;
        $area.removeClass('is-dragging');
        if (isMoved) {
            handlers.end(e.clientX - startX);
        }
    });
    $area[0].addEventListener('click', function (e) {
        if (isMoved) {
            e.preventDefault();
            e.stopPropagation();
            isMoved = false;
        }
    }, true);
}
```

## 호버와 태블릿

- 호버로 나타나는 것은 **마우스를 올리면 나타나고 벗어나면 사라진다.** 처음부터 하나가 켜져 있지 않게 한다 (키보드 `focusin`/`focusout`도 같이)
- 호버로 펼치는 갤러리·아코디언은 호버와 탭 클릭 둘 다로 열리게 한다
- **1024 이하는 태블릿·모바일이라 호버가 없다고 본다.** 호버로만 보이던 내용은 모두 펼쳐서 보여주고, 그 내용을 고르던 탭은 숨긴다. 이 구간에서는 호버·active 상태에 따라 모양이 바뀌지 않게 한다
- 호버로만 보이던 이미지 미리보기(목록 hover 썸네일 등)는 1024 이하에서 숨긴다
- 이미지가 펼쳐지는 칸은 열릴 때 이미지가 살짝 커지는 효과(`scale(1.12)`, 1.2초)를 모든 칸에 똑같이 준다. 사진 비율에 따라 커지는 칸과 안 커지는 칸이 섞이지 않게 한다

## 쌓일 때 정렬

- 좌우로 나뉘어 있던 섹션 헤드(제목 왼쪽·설명 오른쪽)가 쌓이는 1024 이하에서 섹션 버튼이 아래 가운데로 내려가면, 그 섹션의 제목·설명·탭·컨트롤도 가운데 정렬한다
- 한 단으로 쌓이는 640 이하에서는 슬라이드 컨트롤(이전·다음·카운터)과 버튼을 각각 한 줄에 가운데로 둔다

## 탭 목록이 잘리지 않게

탭은 PC에서 한 줄이어도 폭이 줄면 끝 탭이 반쯤 잘리기 쉽다. **탭 글자 길이와 개수를 보고 분기점마다 정한다.** 잘린 채로 두지 않는다.

- 먼저 잰다: 탭 전체 폭(글자 + 좌우 padding + gap)이 몇 px 화면부터 컨테이너를 넘는지. 그 폭 바로 위 분기점에서 바꾼다 (1024·640만 보지 말고 800·445도)
- 탭 4개 이하: 같은 폭 칸으로 나눈다 (`grid-template-columns: repeat(4, minmax(0, 1fr))`). 칸이 좁아지는 640 이하는 2열(2×2). 글자가 두 줄이 되면 padding과 글자 크기를 줄이고, 그래도 넘치면 2열로 내린다
- 탭 5~9개: 640 이하에서 3열 알약(pill) 격자. 선택된 탭은 배경색으로 구분. 줄 수가 늘어도 모든 탭이 보이게 한다
- 탭 10개 이상이거나 글자가 긴 필터: 가로 스크롤을 쓰되 **넘친다는 신호를 준다**
  - 다음 탭이 일부 보이게 끝에 여백(`padding-right`)을 두고, 오른쪽 끝에 배경색 그라데이션
  - 선택한 탭이 화면 밖이면 클릭·자동 전환 때 `scrollIntoView({ inline: 'center', block: 'nearest' })`
  - 스크롤 영역에 훅 클래스 `__overflow`를 붙인다 (검사 스크립트가 의도한 넘침으로 본다)
- 세로로 쌓인 탭(PC 왼쪽 목록)은 1024 이하에서 위 기준으로 가로 격자로 바꾼다
- 탭 글자에 `overflow: hidden`·말줄임(`…`)을 쓰지 않는다. 글자를 줄이거나 칸을 늘린다
- 넘치지 않는 짧은 탭 목록은 가운데 정렬 (`justify-content: center`)
- 검수 때 `scripts/check_layout.js`가 모든 폭에서 탭이 잘리거나 넘치는지 찾아 준다. 나오면 위 기준으로 고친다

## 잘림·정렬 실수 방지

- `overflow: hidden`인 슬라이드 영역 안 카드에 그림자가 있으면, 그림자가 퍼지는 거리(y offset + blur)만큼 영역에 padding을 주고 같은 값만큼 음수 margin으로 바깥 간격을 되돌린다
- 좌우 두 칸이 위 구분선을 나눠 그리는 푸터 같은 구조는 두 칸 높이를 같게(stretch) 하고 내용만 아래 정렬한다. 아래 정렬로 칸 자체를 내리면 구분선이 어긋난다
- 여러 항목이 한 줄로 이어지는 정보(대표자 · 주소 · 전화 · 사업자번호)는 445 이하에서 한 항목씩 줄을 나누고 줄 사이 4px을 더 준다
- 영상·이미지가 특정 모양(아치 등)으로 뚫린 디자인은 피그마의 도형 값(불리언 연산 자식의 크기·모서리)을 그대로 읽어 SVG `clipPath`(`clipPathUnits="objectBoundingBox"` + `scale(1/w, 1/h)`)로 자르고, 감싸는 요소에 `aspect-ratio`를 준다. 겹쳐 놓인 카드는 퍼센트 위치로 함께 줄어들게 한다

## 분기점별 레이아웃 (시안이 PC뿐일 때)

한 번에 1열로 무너뜨리지 않는다. 구간마다 PC 구성을 최대한 유지하며 줄인다.

- **1280 이하**: 레이아웃은 그대로, 칸 폭·여백·글자만 줄인다. 좌우로 나뉜 블록(사진 + 글)은 비율을 바꿔(예: 1:1 → 5:7) 글 칸이 좁아지지 않게 한다. 목록을 1열로 바꾸지 않는다
- **1024 이하**: 메인 비주얼 내용은 가운데 정렬, 폼은 가운데에 최대 480. 좌우 교차형(이미지 + 글)은 800까지 2칸 유지, 800 이하에서 이미지 위·글 아래 가운데
- **카드 목록**(크기가 다른 카드 섞임): 1024 이하에서 슬라이더로 바꾸지 않고 **밑으로 떨군다.** 큰 카드는 한 줄을 다 쓰며 썸네일 · 글을 좌우로(썸네일 56%), 나머지 카드는 2열. 640 이하 1열. 정사각 썸네일은 1024 이하에서 4:3으로 낮춰 화면을 덜 차지하게 한다 (배너처럼 글자가 든 이미지는 비율 유지)
- 시안에서 높이가 같은 카드는 PC 폭에서 높이가 같아야 한다. 칸 사이 간격까지 `fr`로 나눠(`586fr 70fr 380fr 24fr 380fr`) 비율을 지킨다. 고정 margin을 섞으면 줄어들 때 높이가 어긋난다
- 사진이 양옆에 떠 있는 가운데 문구 섹션: 1025 이상은 구성 유지(사진 폭·문구 크기만 줄임), 1024 이하에서 문구 위 · 사진 두 장 나란히
- 정보가 여러 칸인 곳(오시는 길 · 전화): 1024까지 2칸 유지
- 푸터 정보가 줄바꿈되며 한 항목만 다음 줄에 남지 않게 1024 이하는 grid(3열, 주소 2칸), 640 이하 2열, 445 이하 한 줄씩
- 링크로 된 카드를 끄는 슬라이더는 `a`의 기본 드래그를 막는다 (`-webkit-user-drag: none`, `dragstart` preventDefault). 안 막으면 pointer 이벤트가 취소돼 드래그가 안 된다
