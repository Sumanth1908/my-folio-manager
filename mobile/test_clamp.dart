void main() {
  var a = [];
  try {
    print((-1).clamp(0, -1));
  } catch (e) {
    print("error: $e");
  }
}
