package imports

import "testing"

func TestExtractAwemeID(t *testing.T) {
	got := extractAwemeID("/@cooking.tv19/photo/7655600141617089812")
	if got != "7655600141617089812" { t.Fatalf("got %q", got) }
}
