var builder = WebApplication.CreateBuilder(args);

// 1. إضافة خدمة الـ CORS للسماح للفرونت إند بالاتصال
builder.Services.AddCors(options =>
{
    options.AddPolicy("AllowAll", policy =>
    {
        policy.AllowAnyOrigin()
              .AllowAnyMethod()
              .AllowAnyHeader();
    });
});

builder.Services.AddControllers();
builder.Services.AddEndpointsApiExplorer();

var app = builder.Build();

app.UseHttpsRedirection();

// 2. تفعيل سياسة الـ CORS هنا
app.UseCors("AllowAll");

app.UseAuthorization();

app.MapControllers();

app.Run();