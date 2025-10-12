using System;
using Microsoft.EntityFrameworkCore.Migrations;
using Npgsql.EntityFrameworkCore.PostgreSQL.Metadata;

#nullable disable

namespace backend.Migrations
{
    /// <inheritdoc />
    public partial class AddTypesetRequestsTable : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.CreateTable(
                name: "TypesetRequests",
                columns: table => new
                {
                    Id = table.Column<int>(type: "integer", nullable: false)
                        .Annotation("Npgsql:ValueGenerationStrategy", NpgsqlValueGenerationStrategy.IdentityByDefaultColumn),
                    UserId = table.Column<string>(type: "character varying(255)", maxLength: 255, nullable: false),
                    UserEmail = table.Column<string>(type: "character varying(255)", maxLength: 255, nullable: false),
                    UserName = table.Column<string>(type: "character varying(255)", maxLength: 255, nullable: false),
                    PaperFilePath = table.Column<string>(type: "character varying(500)", maxLength: 500, nullable: true),
                    CloudinaryUrl = table.Column<string>(type: "character varying(1000)", maxLength: 1000, nullable: true),
                    UserMessage = table.Column<string>(type: "character varying(500)", maxLength: 500, nullable: true),
                    PaperMetadata = table.Column<string>(type: "text", nullable: true),
                    Status = table.Column<string>(type: "character varying(50)", maxLength: 50, nullable: false, defaultValue: "Pending"),
                    AdminNotes = table.Column<string>(type: "text", nullable: true),
                    AdminProcessedBy = table.Column<string>(type: "character varying(255)", maxLength: 255, nullable: true),
                    RequestedAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: false),
                    CompletedAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: true),
                    CreatedAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: false, defaultValueSql: "CURRENT_TIMESTAMP"),
                    UpdatedAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: false, defaultValueSql: "CURRENT_TIMESTAMP")
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_TypesetRequests", x => x.Id);
                    table.ForeignKey(
                        name: "FK_TypesetRequests_UserProfiles_UserId",
                        column: x => x.UserId,
                        principalTable: "UserProfiles",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateIndex(
                name: "IX_TypesetRequests_RequestedAt",
                table: "TypesetRequests",
                column: "RequestedAt");

            migrationBuilder.CreateIndex(
                name: "IX_TypesetRequests_Status",
                table: "TypesetRequests",
                column: "Status");

            migrationBuilder.CreateIndex(
                name: "IX_TypesetRequests_UserId",
                table: "TypesetRequests",
                column: "UserId");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropTable(
                name: "TypesetRequests");
        }
    }
}
