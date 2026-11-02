using System.Globalization;
using System.Text.Json;
using Xunit;

namespace AiI18n.Tests;

public class I18nTests
{
    public I18nTests()
    {
        I18n.Configure(new I18nOptions());
        I18n.Strict = false;
        I18n.SetLocale("en");
    }

    [Fact]
    public void MissingKeyReturnsSource()
    {
        Assert.Equal("Save", I18n.T("Save"));
    }

    [Fact]
    public void EmbeddedGermanCatalogFormatsAndReappliesWhitespace()
    {
        I18n.SetLocale("de");
        Assert.Equal("Speichern", I18n.T("Save"));
        Assert.Equal(" Hallo 2", I18n.T(" Hello {0}", 2));
        Assert.Equal("Öffnen", I18n.Tp("menu", "Open"));
    }

    [Fact]
    public void CultureChainFallsBackToParent()
    {
        I18n.SetLocale("pt-BR");
        Assert.Equal("pt", I18n.CurrentLocale);
        Assert.Equal("Guardar", I18n.T("Save"));
    }

    [Fact]
    public void StrictModeThrowsWhenTheKeyIsMissing()
    {
        I18n.SetLocale("de");
        I18n.Strict = true;
        var error = Assert.Throws<InvalidOperationException>(() => I18n.T("Not in the catalog"));
        Assert.Contains("Not in the catalog", error.Message);
    }

    [Fact]
    public void CustomLoaderSuppliesPlurals()
    {
        var singular = "1 sample";
        var digest = Md5Eight(singular);
        var json = JsonSerializer.Serialize(new Dictionary<string, string>
        {
            [digest + "_one"] = "1 Probe",
            [digest + "_other"] = "{0} Proben",
        });
        I18n.Configure(new I18nOptions
        {
            OpenLocale = locale => locale == "de"
                ? new MemoryStream(System.Text.Encoding.UTF8.GetBytes(json))
                : null,
        });
        I18n.SetLocale("de");
        Assert.Equal("1 Probe", I18n.Tn(singular, "{0} samples", 1));
        Assert.Equal("2 Proben", I18n.Tn(singular, "{0} samples", 2));
    }

    [Fact]
    public void CompositeAlignmentFormats()
    {
        CultureInfo.CurrentUICulture = CultureInfo.GetCultureInfo("en-US");
        var text = I18n.T("Value {0,-10:0.0}", 1.5);
        Assert.Contains("1.5", text);
        Assert.StartsWith("Value ", text);
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
            Assert.Equal(row.Form, I18n.PluralForm(row.Locale, row.N));
        }
    }

    [Fact]
    public void RightToLeftFollowsTheCulture()
    {
        Assert.True(I18n.IsRightToLeft("ar"));
        Assert.False(I18n.IsRightToLeft("en"));
    }

    [Fact]
    public void MarkOnlyReturnsTheArgument()
    {
        Assert.Equal("Light", I18n.N("Light"));
    }

    [Fact]
    public void SecondConfigureClearsFlatDirectoryAndNullLocalesKeepsTheList()
    {
        var previous = I18n.SupportedLocales.ToArray();
        var dir = Path.Combine(Path.GetTempPath(), "ai-i18n-flat-" + Guid.NewGuid().ToString("N"));
        Directory.CreateDirectory(dir);
        try
        {
            File.WriteAllText(Path.Combine(dir, "de.json"), "{\"Save\":\"VonPlatte\"}");
            I18n.Configure(new I18nOptions
            {
                FlatDirectory = dir,
                Locales = new[] { new LocaleInfo("de", "Deutsch", "German") },
            });
            I18n.SetLocale("de");
            Assert.Equal("VonPlatte", I18n.T("Save"));
            Assert.Equal("de", Assert.Single(I18n.SupportedLocales).Code);

            I18n.Configure(new I18nOptions
            {
                Locales = new[]
                {
                    new LocaleInfo("en", "English", "English"),
                    new LocaleInfo("fr", "Français", "French"),
                },
            });
            I18n.SetLocale("de");
            Assert.Equal("Speichern", I18n.T("Save"));
            Assert.Equal(new[] { "en", "fr" }, I18n.SupportedLocales.Select(row => row.Code).ToArray());

            I18n.Configure(new I18nOptions());
            Assert.Equal(new[] { "en", "fr" }, I18n.SupportedLocales.Select(row => row.Code).ToArray());
        }
        finally
        {
            I18n.Configure(new I18nOptions { Locales = previous });
            I18n.SetLocale("en");
            if (Directory.Exists(dir))
            {
                Directory.Delete(dir, true);
            }
        }
    }

    private static string Md5Eight(string text)
    {
        var bytes = System.Security.Cryptography.MD5.HashData(System.Text.Encoding.UTF8.GetBytes(text));
        return Convert.ToHexString(bytes, 0, 4).ToLowerInvariant();
    }

    private sealed class PluralRow
    {
        public string Locale { get; set; } = "";
        public int N { get; set; }
        public string Form { get; set; } = "";
    }
}
