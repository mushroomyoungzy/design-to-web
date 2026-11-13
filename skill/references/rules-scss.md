# SCSS 규칙

Tailwind는 쓰지 않는다. 모든 요소에 BEM 클래스를 정하고 스타일은 전부 SCSS로 쓴다.

## 파일

- 페이지 스타일은 `assets/css/scss/<id>.scss` 하나에만 쓴다 → `assets/css/<id>.css`
- `template/assets/css/scss/_page-template.scss`를 복사해 시작하고 `#page_id`를 `#<id>`로 바꾼다
- 상단 2줄 고정: `@use "abstracts/variables" as *;` / `@use "abstracts/mixins" as *;`
- 들여쓰기는 공백 4칸
- `base.css`(reset·typography·root·common·layout)와 `appearance/*.css`(색·스케일·inner)는 사이트에 이미 있다고 보고 쓴다. 페이지 SCSS에 다시 넣지 않는다
- 컴파일: `npx sass@1 --no-source-map assets/css/scss/<id>.scss assets/css/<id>.css`

## `#<id>` 감싸기

- 모든 선택자를 `#<id>` 안에 중첩한다. 떼어 간 CSS만으로 동작해야 하기 때문이다
- 페이지에서 쓰는 공통 클래스(`.inner`, `.sr-only` 등)도 `#<id>` 안에 다시 정의한다 (템플릿에 들어 있음)

```scss
#<id> {
    .main-visual {
        height: 100dvh;

        &__title { … }
    }
}
```

## 스케일 (vw-rem)

- `appearance/layout.css`가 분기점마다 html font-size를 vw로 다시 잡는다. 1920 / 1280 / 1024 / 640에서 **1rem ≈ 1px**, 그 사이는 비례해서 커지고 줄어든다
- 치수는 `px-rem(N)`. 단 **3px 이하(1·2px 보더, -1px 보정, 작은 blur·radius)는 px 그대로** (rem이면 소수 픽셀이 되어 선이 깨진다)
- 글자 크기는 `font-size: px-rem(N)`이 아니라 **항상 `@include font-resize(N)`** (작은 화면에서 `--fs-*` 비율로 덜 줄어들게 한다)
- 모든 치수는 **4의 배수**. 나눠떨어지지 않으면 올림. 예외: 1·2px 선, em 자간, 비율, line-height 배수, 퍼센트

## 색

- 색은 `var(--color-*)`. 투명도는 `rgba(var(--color-primary-rgb), 0.2)`
- 기본 토큰 목록은 `appearance/color.css` (primary, secondary, text, border, gray 단계 등). 디자인의 색으로 값을 바꿔 쓴다
- 목록에 없는 추가 토큰은 `base/_root.scss`의 `:root`에 넣는다

## 속성 작성 순서

1. display
2. grid 관련 (grid-template-*, grid-column, grid-row …)
3. flex 관련 (flex, flex-direction, flex-wrap …)
4. order
5. self (align-self, justify-self, place-self)
6. justify-*
7. align-*
8. gap
9. position
10. top, bottom, right, left
11. width
12. height
13. overflow
14. visibility
15. opacity
16. padding
17. margin
18. font (family, style, size, weight, color)
19. line-height
20. text-*
21. letter-spacing
22. 기타 텍스트 (white-space, word-break …)
23. vertical-align
24. border-*
25. outline
26. background-*
27. 기타 속성
28. transform
29. transition
30. animation
31. z-index

## 미디어쿼리와 호버

- 미디어쿼리를 파일 하단에 몰지 않는다. 각 선택자 블록 안에서 **속성 → 미디어쿼리 → 중첩 선택자** 순서
- 호버는 그 요소 블록 안에 `@media (hover: hover) { &:focus, &:hover { … } }`. `:hover`만 걸지 않고 `:focus`를 함께 건다
- 클릭으로 상태가 바뀌는 토글 버튼(햄버거 등)은 `&:focus-visible, &:hover` (클릭 후 남은 포커스 때문에 닫힌 뒤에도 호버 모양이 남는 문제)
- 명시도가 모자라도 구조를 지키고 `!important`로 끊는다

```scss
&__text {
    display: grid;
    gap: px-rem(32);
    padding: px-rem(56);

    @media (max-width: 1280px) { padding: px-rem(48); }
    @media (max-width: 1024px) { padding: px-rem(44); }
    @media (max-width: 640px)  { padding: px-rem(32); }

    &::after { … }
}
```

## 분기점

- 사용: 1600 · 1440 · 1280 · 1024 · 800 · 640 · 500 · 445 · 360 (전부 max-width). 주요: 1024 · 640
- 레이아웃이 바뀌는 지점에만 넣지 않는다. **값이 어색해지는 지점마다** 넣는다 (4열 유지하며 폭만 좁아지는 1280 구간 등)
- 여백은 그 요소만 보지 않고 **인접 여백과 합친 최종 값**으로 판단한다. 1열로 쌓이며 새로 붙는 여백(카드 패딩 + 섹션 패딩 + `.inner` 패딩)을 특히 본다. 상하만 줄여야 하면 `padding-top`/`padding-bottom`을 나눠 쓴다
- 시안이 PC뿐이면 반응형은 이 기준으로 임의 구현한다

## 메인 비주얼 높이

시안 높이를 `height`에 고정하지 않는다.

```scss
.main-visual {
    height: 100dvh;
    min-height: px-rem(640);
    max-height: px-rem(980);
}
```

`max-height`가 시안 높이, `min-height`는 화면 세로가 낮을 때 대비.

## 기본 스타일과 겹치지 않게

`base.css`에 이미 있는 값은 다시 쓰지 않는다.

- 거의 모든 텍스트 요소: `line-height: 1.5`, `letter-spacing: -0.04em`, `word-break: keep-all`, 폰트 `"Pretendard Std"`
- `h1~h3` line-height 1.3, `h4~h6` 1.4
- `h1~h6`, `strong`, `th`: `font-weight: 700` (`span`, `p`는 400이라 굵게 하려면 명시)
- 링크·버튼 `color: inherit`, 밑줄 없음

## 주석

새로 쓰는 CSS/SCSS에는 주석을 넣지 않는다. 설명은 답변 본문에 쓴다. 기존 파일의 주석은 지우지 않는다.

## 이미지

- 이미지는 감싸는 요소를 꽉 채운다: `position: absolute; top: 0; left: 0; width: 100%; height: 100%; object-fit: cover`
- 감싸는 요소는 `position: relative; overflow: hidden`, 비율은 `aspect-ratio`

## 자주 하는 실수

- `#<id>` 안에서 `&--mod &__el`, `&.is-open &__el`처럼 `&`를 두 번 쓰면 `#<id> .a--mod #<id> .a__el`로 컴파일돼 선택자가 깨진다. 두 번째는 클래스 이름을 그대로 쓴다 (`&--mod .a__el`)
- `grid-template-areas`가 없는 상태에서 `grid-area: 이름`을 주면 암묵적 칸이 생겨 요소가 엉뚱한 자리로 간다. 영역 이름은 템플릿을 정의한 미디어쿼리 안에서만 준다
- 화면 밖으로 `transform: translateX(100%)`한 고정(fixed) 패널은 가로 스크롤을 만든다. 모바일 메뉴는 투명도·세로 이동으로 숨긴다
- 원 다이어그램처럼 안쪽 요소가 많고 좌표로 배치된 그림은 감싸는 요소에 `container-type: inline-size; aspect-ratio`를 주고, 안쪽 좌표·크기를 `cqw`로 바꾸는 함수(`@function cq($n) { 820 기준 비율 * 1cqw }`)로 쓴다. 그림 전체가 한 덩어리로 줄어든다. 글자는 `max(cq(12), px-rem(10))`처럼 최소값을 둔다
- 비율이 바뀌는 영역(`preserveAspectRatio="none"`)의 SVG 선은 `vector-effect="non-scaling-stroke"`로 두께를 지키고, 그리는 효과는 `stroke-dasharray` 대신 `clip-path: inset(0 100% 0 0)` → `inset(0)` 전환으로 한다 (dasharray는 늘어난 좌표와 안 맞는다)
- 회전하는 링의 회전 중심이 링 중심이 아니면 `transform-origin`을 % 로 계산해 둔다 ((중심 x - 링 left) / 링 지름)
- `backdrop-filter`를 준 요소 안의 `position: fixed` 자식은 화면이 아니라 그 요소 기준으로 붙는다. 고정 헤더의 흐림 배경은 `::before`에 주고, 헤더 안 전체 메뉴 패널이 화면을 덮게 한다
- `base.css`가 텍스트 요소마다 `font-family`·`line-height`·`letter-spacing`을 직접 주므로, 페이지 폰트가 Pretendard가 아니면 `#<id>` 안에서 해당 요소들에 `inherit`를 주고 `#<id>`에 폰트를 지정한다
- Sass의 `if()` 함수는 쓰지 않는다(새 버전에서 경고). `@if`로 변수를 바꾼다. `list.nth` 등을 쓰면 `@use "sass:list";`를 넣는다

