using System.Text.Json;
using Xunit;

namespace AiI18n.Tests;

public class I18nResxTests
{
    public I18nResxTests()
    {
        I18nResx.Configure("AiI18n.SharedResource");
        I18nResx.Strict = false;
        I18nResx.SetLocale("en");
    }

    [Fact]
    public void NeutralFileIsTheFallback()
    {
        Assert.Equal("Sign in", I18nResx.T("Sign in"));
    }

    [Fact]
    public void GermanSatelliteTranslatesFreeTextKeys()
    {
        I18nResx.SetLocale("de");
        Assert.Equal("Anmelden", I18nResx.T("Sign in"));
        Assert.Equal(" Gespeichert unter /tmp", I18nResx.T(" Saved to {0}", "/tmp"));
        Assert.Equal("Sag \"hallo\" & tschüss", I18nResx.T("Say \"hi\" & bye"));
        Assert.Equal("Zeile1\nZeile2", I18nResx.T("Line1\nLine2"));
        Assert.Equal("Öffnen", I18nResx.Tp("menu", "Open"));
        Assert.Equal("1 Probe", I18nResx.Tn("1 sample", "{0} samples", 1));
        Assert.Equal("2 Proben", I18nResx.Tn("1 sample", "{0} samples", 2));
    }

    [Fact]
    public void MissingKeyReturnsTheSource()
    {
        I18nResx.SetLocale("de");
        Assert.Equal("Not in the file", I18nResx.T("Not in the file"));
    }

    [Fact]
    public void PluralFormsMatchTheSharedFixture()
    {
        var path = Path.Combine(AppContext.BaseDirectory, "plural-parity.json");
        var rows = JsonSerializer.Deserialize<List<PluralRow>>(
            File.ReadAllText(path),
            new JsonSerializerOptions { PropertyNameCaseInsensitive = true }
        );
        Assert.NotNull(rows);
        foreach (var row in rows!)
        {
            Assert.Equal(row.Form, I18nResx.PluralForm(row.Locale, row.N));
        }
    }

    private sealed class PluralRow
    {
        public string Locale { get; set; } = "";
        public int N { get; set; }
        public string Form { get; set; } = "";
    }
}
