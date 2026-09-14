package imports

import (
	"fmt"
	"net/http"
	"strings"

	"github.com/danirisdiandita/malas-monorepo/api/ent/folder"
	"github.com/danirisdiandita/malas-monorepo/api/internal/recipes"
	"github.com/google/uuid"
)

func pipelinePreferences(r *http.Request, p *Pipeline, languageCode, folderID string) (ImportPreferences, error) {
	languageCode = strings.ToLower(strings.TrimSpace(languageCode))
	if languageCode == "auto" {
		languageCode = ""
	}
	if len(languageCode) > 12 || strings.ContainsAny(languageCode, " \t\n") {
		return ImportPreferences{}, fmt.Errorf("invalid language code")
	}
	preferences := ImportPreferences{LanguageCode: languageCode}
	if strings.TrimSpace(folderID) == "" {
		return preferences, nil
	}
	id, err := uuid.Parse(folderID)
	if err != nil {
		return ImportPreferences{}, fmt.Errorf("invalid folder")
	}
	owner, err := recipes.OwnerID(p.DB, r)
	if err != nil {
		return ImportPreferences{}, err
	}
	exists, err := p.DB.Folder.Query().Where(folder.ID(id), folder.UserID(owner)).Exist(r.Context())
	if err != nil || !exists {
		return ImportPreferences{}, fmt.Errorf("folder not found")
	}
	preferences.FolderID = &id
	return preferences, nil
}
