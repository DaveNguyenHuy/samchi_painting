# Sam&Chi Painting 🎨

App vẽ + tô màu offline cho iPad Air 3, làm riêng cho Linh Chi & Linh Sam.
Icon app = ảnh hai bé (`assets/logo.png`).

## Tính năng

- **Vẽ tự do** – bút chì / cọ / tẩy, thanh trượt 10 mức cỡ nét, bảng 12 màu, undo/redo, xoá hết, lưu.
  Độ dày nét cố định theo mức đã chọn (dùng lực nhấn nếu bút có báo `stylusData.pressure`).
  Tự lưu bản vẽ, mở lại là còn.
- **Tô màu tranh** – 60 bức tranh nét vẽ sẵn (thú, xe, đồ ăn, thiên nhiên, cổ tích…).
  **Tô màu tự do bằng cọ** đè lên hình nét (nét đen luôn hiện ở trên, tô trong khung hình).
  Cọ / tẩy / thanh trượt 10 mức cỡ nét / bảng màu. Nút ▦ mở lưới thumbnail chọn tranh, 🎲 bốc ngẫu nhiên.
  Undo/redo, "Tô lại" xoá hết.
  **Tự lưu**: nét cọ theo từng bức + nhớ bức đang tô dở → mở lại là tô tiếp đúng chỗ.
- **Thư viện** – xem lại tranh đã lưu, lưu tiếp vào ứng dụng Ảnh, hoặc bỏ đi.
- Hiệu ứng âm thanh bật/tắt bằng nút loa. Khoá ngang màn hình.
- Splash screen = ảnh hai bé (`assets/logo.png`) trên nền kem, hiện ~1s rồi mờ dần.

Tranh lưu trong bộ nhớ app (`Paths.document/artwork/`) và có thể xuất sang Photos.

## Chạy

Đã build & chạy thử OK trên **iPad Air simulator** (Xcode 26.6). Home / Vẽ tự do / Tô màu đều render đúng, khoá ngang.

### Yarn trên máy này

Shim `yarn` của asdf bị hỏng ("No version is set"). Dùng corepack:

```bash
corepack yarn@4.10.3 install
```

Muốn gõ `yarn` trơn tru: `asdf plugin remove yarn && corepack enable`
→ sau đó `yarn` tự dùng phiên bản trong `packageManager` của package.json.

### Simulator

```bash
xcrun simctl list devices available | grep -i ipad     # xem danh sách
npx expo run:ios --device "iPad Air 11-inch (M4)"       # build & chạy
```

### iPad thật (tài khoản Apple miễn phí)

```bash
npx expo run:ios --device            # chọn iPad Air 3 trong danh sách
```

Cần: mở Xcode 1 lần → Trust iPad, bật **Developer Mode** trên iPad (Settings ▸ Privacy & Security).
Bản build tài khoản free hết hạn sau 7 ngày → chạy lại lệnh trên.

Sửa code hằng ngày: `npx expo start` rồi mở app trên iPad (không build lại native
trừ khi thêm thư viện native / đổi `app.json`).

### Build production (.ipa) + cài bằng AltStore

```bash
./scripts/build-ipa.sh          # → ios/build/SamChiPainting.ipa  (~10 phút lần đầu)
```

Script: `expo prebuild --clean` → `xcodebuild archive` (Release, chưa ký) → đóng gói `.ipa`.

Cài lên iPad:
1. Tải **AltServer** (altstore.io) về Mac, chạy nền.
2. Cài **AltStore** lên iPad qua AltServer (menu bar ▸ Install AltStore).
3. iPad ▸ AltStore ▸ tab **My Apps** ▸ nút **+** ▸ chọn `SamChiPainting.ipa` ▸ nhập Apple ID (free).
4. iPad ▸ Settings ▸ General ▸ VPN & Device Management ▸ Trust cert của bạn.

AltStore tự gia hạn 7 ngày mỗi khi iPad + Mac (chạy AltServer) chung wifi → không phải cắm cáp.
Đổi code → chạy lại `build-ipa.sh` → AltStore ▸ My Apps ▸ cập nhật từ file .ipa mới.

*(Sideloadly cũng được, nhận cả `.ipa` lẫn `.app`, nhưng không auto-refresh.)*

## Cấu trúc

```
app/                 expo-router (index, draw, color, gallery, _layout)
src/screens/         UI từng màn
src/components/       DrawSurface, BrushSlider, VerticalPalette, PagePicker, Toast, ...
src/hooks/           useDrawing.ts (state machine nét vẽ)
src/coloring/         pages.ts (60 tranh, dựng lazy) + shapes.ts (helper hình)
src/lib/             stroke.ts, gallery.ts, artStore.ts (lưu nét), sfx.ts
assets/sfx/          pop.wav, saved.wav
scripts/build-ipa.sh build .ipa production
```

## Ghi chú

- Expo SDK 57 (RN 0.86, React 19.2). Luôn xem https://docs.expo.dev/versions/v57.0.0/ trước khi sửa.
- `expo-doctor` còn báo trùng `react` – do `~/node_modules/react` (của `~/package.json`,
  không phải project này). `metro.config.js` đã neo resolution trong project nên không ảnh hưởng.
  Muốn hết cảnh báo thì dọn `~/node_modules` + `~/package.json`.
- Độ dày nét cố định theo mức trên thanh trượt (bút TQ bên thứ 3 hầu như không gửi
  `stylusData.pressure`; nếu có thì code tự dùng lực nhấn thay cho mức cố định).
- 30 hình tô màu mới (#31–60) dựng "mù" (không xem trực tiếp được) — mở lưới ▦ để soi,
  bức nào xấu báo lại để chỉnh path trong `src/coloring/pages.ts`.
